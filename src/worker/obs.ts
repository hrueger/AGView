/* eslint-disable no-console */
import * as osn from "obs-studio-node";
import { BrowserWindow } from "electron";
import { Subject } from "rxjs";
import * as path from "path";
import * as fs from "fs";
import { ISceneItem, ITransition } from "obs-studio-node";
import * as ffmpeg from "fluent-ffmpeg";
import * as os from "os";
import { Slide } from "../app/_classes/slide";
import { supportedFiles } from "../app/_globals/supportedFilesFilters";
import { Store } from "../app/_helpers/store";
import { settingsStoreOptions } from "../app/_globals/settingsStoreOptions";
import { hexToRgb } from "../app/_helpers/hexToRgb";
import { AlignmentOptions } from "../app/_classes/alignmentOptions";
import { TransitionTypes } from "../app/_globals/transitionTypes";

const LOGO_SCENE_ID = "LOGOSCENE";
const CUSTOM_LOGO_SCENE_ID = "CUSTOMLOGOSCENE";
const BLACK_SCENE_ID = "BLACKSCENE";


ffmpeg.setFfprobePath(path.join(__dirname, "../../bin", os.platform(), os.arch(), os.platform() == "win32" ? "ffprobe.exe" : "ffprobe"));

export class OBS {
    private obsInitialized = false;
    private signals: Subject<any> = new Subject();
    public previewWindow: BrowserWindow;
    private settingsStore: Store;
    private transition: ITransition;

    constructor(parentWindow: BrowserWindow) {
        this.settingsStore = new Store(settingsStoreOptions);
        this.initialize(parentWindow);
    }

    // Init the library, launch OBS Studio instance, configure it, set up sources and scene
    private initialize(win: BrowserWindow) {
        if (this.obsInitialized) {
            console.warn("OBS is already initialized, skipping initialization.");
            return;
        }

        this.initOBS();
        this.configureOBS();
        this.setupSources();
        this.setupPreview(win, {});
        this.obsInitialized = true;

        setInterval(() => {
            try {
                win.webContents.send("performanceStatistics", osn.NodeObs.OBS_API_getPerformanceStatistics());
            } catch {
                //
            }
        }, 1000);
    }

    private initOBS() {
        console.debug("Initializing OBS...");
        osn.NodeObs.IPC.host("obs-studio-node-example"); // Usually some UUIDs go there
        osn.NodeObs.SetWorkingDirectory(path.join(__dirname, "../../node_modules/obs-studio-node"));

        const obsDataPath = path.join(__dirname, "../../osn-data"); // OBS Studio configs and logs
        const initResult = osn.NodeObs.OBS_API_initAPI("en-US", obsDataPath, "1.0.0");

        if (initResult !== 0) {
            const errorReasons = {
                "-2": "DirectX could not be found on your system. Please install the latest version of DirectX for your machine here <https://www.microsoft.com/en-us/download/details.aspx?id=35?> and try again.",
                "-5": "Failed to initialize OBS. Your video drivers may be out of date, or Streamlabs OBS may not be supported on your system.",
            };

            const errorMessage = errorReasons[initResult.toString()] || `An unknown error #${initResult} was encountered while initializing OBS.`;

            console.error("OBS init failure", errorMessage);

            this.shutdown();

            throw Error(errorMessage);
        }

        osn.NodeObs.OBS_service_connectOutputSignals((signalInfo) => {
            this.signals.next(signalInfo);
        });

        console.debug("OBS initialized");
    }

    private configureOBS() {
        console.debug("Configuring OBS");
        this.setSetting("Output", "Mode", "Simple");
        const availableEncoders = this.getAvailableValues("Output", "Recording", "RecEncoder");
        this.setSetting("Output", "RecEncoder", availableEncoders.slice(-1)[0] || "x264");
        this.setSetting("Output", "FilePath", path.join(__dirname, "../videos"));
        this.setSetting("Output", "RecFormat", "mkv");
        this.setSetting("Output", "VBitrate", 10000); // 10 Mbps
        this.setSetting("Video", "FPSCommon", 60);

        console.debug("OBS Configured");
    }

    private setupSources() {
        this.setVideoOutputResolution();
        const logoSource = osn.InputFactory.create("image_source", LOGO_SCENE_ID, { file: path.join(__dirname, "../assets/icons/favicon.png") });
        const customLogoSource = osn.InputFactory.create("image_source", CUSTOM_LOGO_SCENE_ID, { file: this.settingsStore.get("customLogoPath") });
        console.log({ file: this.settingsStore.get("customLogo") });

        const baseAlignment: any = { alignment: "center", padding: 50, scale: "fit" };

        const logoScene = osn.SceneFactory.create(LOGO_SCENE_ID);
        const lsi = logoScene.add(logoSource);
        this.alignItem(undefined, lsi, baseAlignment);

        const customLogoScene = osn.SceneFactory.create(CUSTOM_LOGO_SCENE_ID);
        const clsi = customLogoScene.add(customLogoSource);
        this.alignItem(undefined, clsi, baseAlignment);

        osn.SceneFactory.create(BLACK_SCENE_ID);

        this.transition = osn.TransitionFactory.create(TransitionTypes.Fade, "myTransition", {});
        this.transition.set(logoScene);
        osn.Global.setOutputSource(0, this.transition);
    }

    private setVideoOutputResolution() {
        const outputWidth = this.settingsStore.get("width");
        const outputHeight = this.settingsStore.get("height");
        this.setSetting("Video", "Base", `${outputWidth}x${outputHeight}`);
        this.setSetting("Video", "Output", `${outputWidth}x${outputHeight}`);
    }

    public updateSettings(parentWindow) {
        this.settingsStore = new Store(settingsStoreOptions);
        if (this.previewWindow) {
            this.setupProjector(parentWindow);
        }
        this.setVideoOutputResolution();
    }

    private alignItem(slide: Slide, sceneItem: ISceneItem, options?: AlignmentOptions) {
        if (!options) {
            options = slide.alignment;
        }
        // needed because sometimes the width and height reported by obs are 0
        if (slide && slide.type && slide.type == "video") {
            new Promise<{ width: number; height: number}>((resolve, reject) => {
                ffmpeg.ffprobe(slide.filePath, (err, metadata) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({
                            width: metadata.streams[0].width,
                            height: metadata.streams[0].height,
                        });
                    }
                });
            }).then((size) => {
                this.pAlignItem(options, sceneItem, size.width, size.height);
            });
        } else {
            this.pAlignItem(options, sceneItem);
        }
    }

    private pAlignItem(
        options: AlignmentOptions, sceneItem: osn.ISceneItem, w?: number, h?: number,
    ) {
        const width = this.settingsStore.get("width");
        const height = this.settingsStore.get("height");
        let scaleX = 1;
        let scaleY = 1;
        const fullScaleX = width / (sceneItem.source.width ? sceneItem.source.width : w);
        const fullScaleY = height / (sceneItem.source.height ? sceneItem.source.height : h);
        switch (options.scale) {
        case "fit":
            if (fullScaleX < fullScaleY) {
                scaleY = fullScaleX;
                scaleX = fullScaleX;
            } else {
                scaleX = fullScaleY;
                scaleY = fullScaleY;
            }
            break;
        case "stretch":
            scaleX = fullScaleX;
            scaleY = fullScaleY;
            break;
        case "cover":
            if (fullScaleX > fullScaleY) {
                scaleY = fullScaleX;
                scaleX = fullScaleX;
            } else {
                scaleX = fullScaleY;
                scaleY = fullScaleY;
            }
            break;
        default:
            break;
        }
        sceneItem.scale = { x: scaleX, y: scaleY };
        switch (options.alignment) {
        case "center":
            if (width < height) {
                sceneItem.position = {
                    x: 0,
                    y: (height - (
                        (sceneItem.source.height ? sceneItem.source.height : h) * scaleY)) / 2,
                };
            } else if (width > height) {
                sceneItem.position = {
                    x: (width - (
                        (sceneItem.source.width ? sceneItem.source.width : w) * scaleX)) / 2,
                    y: 0,
                };
            }
            break;
        case "right":
            sceneItem.position = {
                x: (width - (sceneItem.source.width ? sceneItem.source.width : w) * scaleX),
                y: 0,
            };
            break;
        case "left":
            sceneItem.position = { x: 0, y: 0 };
            break;
        default:
            break;
        }
    }

    public setupPreview(parentWindow: BrowserWindow, bounds) {
        osn.NodeObs.OBS_content_createSourcePreviewDisplay(
            parentWindow.getNativeWindowHandle(),
            "", // or use camera source Id here
            "previewDisplay",
        );
        osn.NodeObs.OBS_content_setShouldDrawUI("previewDisplay", false);

        return this.resizePreview(bounds);
    }

    public setupProjector(parentWindow) {
        const displayId = "projector";
        const displayWidth = Math.round(this.settingsStore.get("width") / 2);
        const displayHeight = Math.round(this.settingsStore.get("height") / 2);
        const resized = () => {
            const { width, height } = this.previewWindow.getContentBounds();
            osn.NodeObs.OBS_content_resizeDisplay(displayId, width, height);
            osn.NodeObs.OBS_content_setPaddingSize(displayId, this.settingsStore.get("paddingSize"));
        };
        if (!this.previewWindow) {
            this.previewWindow = new BrowserWindow({
                width: displayWidth,
                height: displayHeight,
                parent: parentWindow,
                useContentSize: true,
                autoHideMenuBar: true,
            });
            this.previewWindow.webContents.on("dom-ready", () => {
                this.previewWindow.webContents.insertCSS("* { cursor: none !important; }");
            });
            this.previewWindow.loadURL("data:text/html;charset=utf-8,");
            this.previewWindow.on("close", () => {
                osn.NodeObs.OBS_content_destroyDisplay("projector");
                this.previewWindow = undefined;
            });
        } else {
            this.previewWindow.removeAllListeners("resize");
        }
        this.previewWindow.on("resize", resized);

        osn.NodeObs.OBS_content_createSourcePreviewDisplay(
            this.previewWindow.getNativeWindowHandle(),
            "", // or use camera source Id here
            displayId,
        );
        osn.NodeObs.OBS_content_setShouldDrawUI(displayId, true);
        osn.NodeObs.OBS_content_setPaddingColor(displayId, ...hexToRgb(this.settingsStore.get("backgroundColor")));
        resized();
    }

    public endProjector() {
        osn.NodeObs.OBS_content_destroyDisplay("projector");
        this.previewWindow.close();
        this.previewWindow = undefined;
    }

    public clearSlides() {
        // this.scenes[0].getItems().forEach((i) => i.remove());
    }

    public updateProperties(slide: Slide) {
        this.alignItem(slide, osn.SceneFactory.fromName(slide.id).getItems()[0]);
    }

    public addFile(slide: Slide) {
        const realpath = fs.realpathSync(slide.filePath);
        let ext = realpath.split(".").splice(-1)[0];
        if (!ext) return null;
        ext = ext.toLowerCase();

        for (const type of supportedFiles) {
            // eslint-disable-next-line no-continue
            if (!type.extensions.includes(ext)) continue;
            let settings = null;
            if (type.obsName === "image_source") {
                settings = { file: slide.filePath };
            } else if (type.obsName === "browser_source") {
                settings = {
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    is_local_file: true,
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    local_file: slide.filePath,
                };
            } else if (type.obsName === "ffmpeg_source") {
                settings = {
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    is_local_file: true,
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    local_file: slide.filePath,
                    looping: true,
                };
            } else if (type.obsName === "text_gdiplus") {
                settings = {
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    read_from_file: true,
                    file: slide.filePath,
                };
            }
            if (settings) {
                const s = this.createSource(slide.id, type.obsName, settings);
                // const sceneItem = this.scenes[0].scene.add(s);
                const scene = osn.SceneFactory.create(slide.id);
                const si = scene.add(s);
                this.alignItem(slide, si);
                return s;
            }
        }
        return null;
    }

    private createSource(
        name: string,
        type: string,
        settings: any = {},
    ) {
        const obsInputSettings = settings;
        const obsInput = osn.InputFactory.create(type, name, obsInputSettings);
        return obsInput;
    }

    public transitionTo(sceneName: string) {
        const scene = osn.SceneFactory.fromName(sceneName);
        this.transition.start(300, scene);
    }
    public transitionToDefaultSlide(slide: "black" | "logo" | "customLogo") {
        const scene = osn.SceneFactory.fromName(slide == "black" ? BLACK_SCENE_ID : slide == "logo" ? LOGO_SCENE_ID : CUSTOM_LOGO_SCENE_ID);
        this.transition.start(300, scene);
    }

    public shutdown() {
        if (!this.obsInitialized) {
            console.debug("OBS is already shut down!");
            return false;
        }

        console.debug("Shutting down OBS...");

        try {
            osn.NodeObs.OBS_service_removeCallback();
            osn.NodeObs.IPC.disconnect();
            this.obsInitialized = false;
        } catch (e) {
            throw Error(`Exception when shutting down OBS process${e}`);
        }

        console.debug("OBS shutdown successfully");

        if (this.previewWindow) {
            this.previewWindow.close();
        }
        return true;
    }

    private setSetting(category, parameter, value) {
        let oldValue;

        // Getting settings container
        const settings = osn.NodeObs.OBS_settings_getSettings(category).data;

        settings.forEach((subCategory) => {
            subCategory.parameters.forEach((param) => {
                if (param.name === parameter) {
                    oldValue = param.currentValue;
                    param.currentValue = value;
                }
            });
        });

        // Saving updated settings container
        if (value != oldValue) {
            osn.NodeObs.OBS_settings_saveSettings(category, settings);
        }
    }

    private getAvailableValues(category, subcategory, parameter) {
        const categorySettings = osn.NodeObs.OBS_settings_getSettings(category).data;
        if (!categorySettings) {
            console.warn(`There is no category ${category} in OBS settings`);
            return [];
        }

        const subcategorySettings = categorySettings.find(
            (sub) => sub.nameSubCategory === subcategory,
        );
        if (!subcategorySettings) {
            console.warn(`There is no subcategory ${subcategory} for OBS settings category ${category}`);
            return [];
        }

        const parameterSettings = subcategorySettings.parameters.find(
            (param) => param.name === parameter,
        );
        if (!parameterSettings) {
            console.warn(`There is no parameter ${parameter} for OBS settings category ${category}.${subcategory}`);
            return [];
        }

        return parameterSettings.values.map((value) => Object.values(value)[0]);
    }

    public resizePreview(bounds) {
        const { scaleFactor } = this.displayInfo();
        const displayWidth = Math.floor(bounds.width);
        const displayHeight = Math.round(bounds.height);
        const displayX = Math.floor(bounds.x);
        const displayY = Math.floor(bounds.y);

        osn.NodeObs.OBS_content_resizeDisplay("previewDisplay", displayWidth * scaleFactor, displayHeight * scaleFactor);
        osn.NodeObs.OBS_content_moveDisplay("previewDisplay", displayX * scaleFactor, displayY * scaleFactor);

        return { height: displayHeight };
    }

    private displayInfo() {
        // eslint-disable-next-line
        const { screen } = require("electron");
        const primaryDisplay = screen.getPrimaryDisplay();
        const { width, height } = primaryDisplay.size;
        const { scaleFactor } = primaryDisplay;
        return {
            width,
            height,
            scaleFactor,
            aspectRatio: width / height,
            physicalWidth: width * scaleFactor,
            physicalHeight: height * scaleFactor,
        };
    }
}
