import * as osn from "obs-studio-node";
import { BrowserWindow } from "electron";
import { Subject } from "rxjs";
import { first } from "rxjs/operators"
import * as path from "path";

export class OBS {
    private obsInitialized: boolean = false;
    private signals: Subject<any> = new Subject();
    public previewWindow: BrowserWindow;

    constructor(parentWindow: BrowserWindow) {
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
        const sceneName = "test-scene";
        this.setupSources(sceneName);
        this.setupPreview(win, sceneName);
        this.obsInitialized = true;

        setInterval(() => {
            try {
                win.webContents.send("performanceStatistics", osn.NodeObs.OBS_API_getPerformanceStatistics());
            } catch { }
        }, 1000);
    }

    private initOBS() {
        console.debug("Initializing OBS...");
        osn.NodeObs.IPC.host("obs-studio-node-example"); // Usually some UUIDs go there
        osn.NodeObs.SetWorkingDirectory(path.join(__dirname, "node_modules", "obs-studio-node"));

        const obsDataPath = path.join(__dirname, "osn-data"); // OBS Studio configs and logs
        // Arguments: locale, path to directory where configuration and logs will be stored, your application version
        const initResult = osn.NodeObs.OBS_API_initAPI("en-US", obsDataPath, "1.0.0");

        if (initResult !== 0) {
            const errorReasons = {
                "-2": "DirectX could not be found on your system. Please install the latest version of DirectX for your machine here <https://www.microsoft.com/en-us/download/details.aspx?id=35?> and try again.",
                "-5": "Failed to initialize OBS. Your video drivers may be out of date, or Streamlabs OBS may not be supported on your system.",
            }

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
        this.setSetting("Output", "FilePath", path.join(__dirname, "videos"));
        this.setSetting("Output", "RecFormat", "mkv");
        this.setSetting("Output", "VBitrate", 10000); // 10 Mbps
        this.setSetting("Video", "FPSCommon", 60);

        console.debug("OBS Configured");
    }

    private setupSources(sceneName: string) {
        const videoSource = osn.InputFactory.create("monitor_capture", "desktop-video");
        const audioSource = osn.InputFactory.create("wasapi_output_capture", "desktop-audio");
        const micSource = osn.InputFactory.create("wasapi_input_capture", "mic-audio");

        // Get information about prinary display
        const { screen } = require("electron");
        const primaryDisplay = screen.getPrimaryDisplay();
        const realDisplayWidth = primaryDisplay.size.width * primaryDisplay.scaleFactor;
        const realDisplayHeight = primaryDisplay.size.height * primaryDisplay.scaleFactor;
        const aspectRatio = realDisplayWidth / realDisplayHeight;

        // Update source settings:
        let settings = videoSource.settings;
        settings["width"] = realDisplayWidth;
        settings["height"] = realDisplayHeight;
        videoSource.update(settings);
        videoSource.save();

        // Set output video size to 1920x1080
        const outputWidth = 1920;
        const outputHeight = Math.round(outputWidth / aspectRatio);
        this.setSetting("Video", "Base", `${outputWidth}x${outputHeight}`);
        this.setSetting("Video", "Output", `${outputWidth}x${outputHeight}`);
        const videoScaleFactor = realDisplayWidth / outputWidth;

        // A scene is necessary here to properly scale captured screen size to output video size
        const scene = osn.SceneFactory.create(sceneName);
        const sceneItem = scene.add(videoSource);
        sceneItem.scale = { x: 1.0 / videoScaleFactor, y: 1.0 / videoScaleFactor };

        // Tell recorder to use this source (I'm not sure if this is the correct way to use the first argument `channel`)
        osn.Global.setOutputSource(1, scene);
        osn.Global.setOutputSource(2, audioSource);
        osn.Global.setOutputSource(3, micSource);
    }

    public setupPreview(parentWindow: BrowserWindow, bounds) {
        /*const displayId = "display1";
        const displayWidth = 960;
        const displayHeight = 540;

        this.previewWindow = new BrowserWindow({
            width: displayWidth,
            height: displayHeight,
            parent: parentWindow,
            x: 2000,
            y: 50,
        });
        this.previewWindow.on("resize", () => {
            const [width, height] = this.previewWindow.getSize();
            osn.NodeObs.OBS_content_resizeDisplay(displayId, width, height);
        });

        osn.NodeObs.OBS_content_createSourcePreviewDisplay(
            this.previewWindow.getNativeWindowHandle(),
            sceneName, // or use camera source Id here
            displayId,
        );
        osn.NodeObs.OBS_content_setShouldDrawUI(displayId, true);
        osn.NodeObs.OBS_content_resizeDisplay(displayId, displayWidth, displayHeight);*/
        osn.NodeObs.OBS_content_createSourcePreviewDisplay(
            parentWindow.getNativeWindowHandle(),
            "", // or use camera source Id here
            "previewDisplay",
        );
        osn.NodeObs.OBS_content_setShouldDrawUI("previewDisplay", false);

        return this.resizePreview(bounds);
    }

    private async start() {
        if (!this.obsInitialized) this.initialize(undefined);

        let signalInfo;

        console.debug("Starting recording...");
        osn.NodeObs.OBS_service_startRecording();

        console.debug("Started?");
        signalInfo = await this.getNextSignalInfo();

        if (signalInfo.signal === "Stop") {
            throw Error(signalInfo.error);
        }

        console.debug("Started signalInfo.type:", signalInfo.type, "(expected: \"recording\")");
        console.debug("Started signalInfo.signal:", signalInfo.signal, "(expected: \"start\")");
        console.debug("Started!");
    }

    private async stop() {
        let signalInfo;

        console.debug("Stopping recording...");
        osn.NodeObs.OBS_service_stopRecording();
        console.debug("Stopped?");

        signalInfo = await this.getNextSignalInfo();

        console.debug("On stop signalInfo.type:", signalInfo.type, "(expected: \"recording\")");
        console.debug("On stop signalInfo.signal:", signalInfo.signal, "(expected: \"stopping\")");

        signalInfo = await this.getNextSignalInfo();

        console.debug("After stop signalInfo.type:", signalInfo.type, "(expected: \"recording\")");
        console.debug("After stop signalInfo.signal:", signalInfo.signal, "(expected: \"stop\")");

        console.debug("Stopped!");
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
            throw Error("Exception when shutting down OBS process" + e);
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

        settings.forEach(subCategory => {
            subCategory.parameters.forEach(param => {
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

        const subcategorySettings = categorySettings.find(sub => sub.nameSubCategory === subcategory);
        if (!subcategorySettings) {
            console.warn(`There is no subcategory ${subcategory} for OBS settings category ${category}`);
            return [];
        }

        const parameterSettings = subcategorySettings.parameters.find(param => param.name === parameter);
        if (!parameterSettings) {
            console.warn(`There is no parameter ${parameter} for OBS settings category ${category}.${subcategory}`);
            return [];
        }

        return parameterSettings.values.map(value => Object.values(value)[0]);
    }

    private getNextSignalInfo() {
        return new Promise((resolve, reject) => {
            this.signals.pipe(first()).subscribe(signalInfo => resolve(signalInfo));
            setTimeout(() => reject("Output signal timeout"), 30000);
        });
    }


    public resizePreview(bounds) {
        const { aspectRatio, scaleFactor } = this.displayInfo();
        const displayWidth = Math.floor(bounds.width);
        const displayHeight = Math.round(bounds.height);
        const displayX = Math.floor(bounds.x);
        const displayY = Math.floor(bounds.y);

        osn.NodeObs.OBS_content_resizeDisplay("previewDisplay", displayWidth * scaleFactor, displayHeight * scaleFactor);
        osn.NodeObs.OBS_content_moveDisplay("previewDisplay", displayX * scaleFactor, displayY * scaleFactor);

        return { height: displayHeight }
    }

    private displayInfo() {
        const { screen } = require("electron");
        const primaryDisplay = screen.getPrimaryDisplay();
        const { width, height } = primaryDisplay.size;
        const { scaleFactor } = primaryDisplay;
        return {
            width,
            height,
            scaleFactor: scaleFactor,
            aspectRatio: width / height,
            physicalWidth: width * scaleFactor,
            physicalHeight: height * scaleFactor,
        }
    }

}
