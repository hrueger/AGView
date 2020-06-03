/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
import {
    app, BrowserWindow, screen, ipcMain,
} from "electron";
import * as path from "path";
import * as url from "url";
import { OBS } from "./src/worker/obs";
import { Store } from "./src/app/_helpers/store";
import { Slide } from "./src/app/_classes/slide";

let win: BrowserWindow = null;
let obs: OBS = null;
const args = process.argv.slice(1);
const serve = args.some((val) => val === "--serve");

function createWindow(): BrowserWindow {
    const size = screen.getPrimaryDisplay().workAreaSize;
    const store = new Store({
        configName: "window-state",
        defaults: {
            windowBounds: {
                width: size.width / 2,
                height: size.height / 2,
                x: undefined,
                y: undefined,
                isMaximized: false,
            },
        },
    });
    const {
        width, height, x, y, isMaximized,
    } = store.get("windowBounds");
    win = new BrowserWindow({
        width,
        height,
        x,
        y,
        icon: path.join(__dirname, "src/assets/icons/favicon.png"),
        webPreferences: {
            nodeIntegration: true,
            webSecurity: false,
            allowRunningInsecureContent: !!(serve),
        },
        frame: false,
        backgroundColor: "#1E1E1E",
    });
    if (isMaximized) {
        win.maximize();
    }
    win.on("resize", () => {
        storeWindowState(store);
    });
    win.on("move", () => {
        storeWindowState(store);
    });

    if (serve) {
        require("devtron").install();
        win.webContents.openDevTools();

        require("electron-reload")(__dirname, {
            electron: require(`${__dirname}/node_modules/electron`),
        });
        win.loadURL("http://localhost:4200");
    } else {
        win.loadURL(url.format({
            pathname: path.join(__dirname, "dist/index.html"),
            protocol: "file:",
            slashes: true,
        }));
    }

    ipcMain.on("obs-action", (action: any, ...data) => {
        switch (action) {
        case "initialize":
            if (obs) {
                obs.shutdown();
                obs = undefined;
            }
            obs = new OBS(win);
            break;
        default:
            // eslint-disable-next-line no-console
            console.log("unknown event:", action, data);
        }
    });
    ipcMain.on("preview-init", (bounds) => {
        ipcMain.emit("preview-height", obs.setupPreview(win, bounds));
    });

    ipcMain.on("preview-bounds", (bounds) => {
        ipcMain.emit("preview-height", obs.resizePreview(bounds));
    });
    ipcMain.on("projector-init", () => {
        obs.setupProjector(win);
    });
    ipcMain.on("projector-end", () => {
        obs.endProjector();
    });
    ipcMain.on("add-slides", (slides) => {
        for (const slide of slides as unknown as Slide[]) {
            obs.addFile(slide);
        }
    });
    ipcMain.on("transition-to", (slide) => {
        obs.transitionTo((slide as unknown as Slide).id);
    });
    ipcMain.on("transition-to-default-slide", (slide) => {
        obs.transitionToDefaultSlide(slide as unknown as "black" | "logo" | "customLogo");
    });
    ipcMain.on("update-properties", (slide) => {
        obs.updateProperties(slide as unknown as Slide);
    });
    ipcMain.on("clear-slides", () => {
        obs.clearSlides();
    });
    ipcMain.on("settings-changed", () => {
        obs.updateSettings(win);
    });
    ipcMain.on("shutdown", () => {
        obs.shutdown();
    });

    // Emitted when the window is closed.
    win.on("closed", () => {
        // Dereference the window object, usually you would store window
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        obs.shutdown();
        console.log("shut down");
        app.quit();
    });

    return win;
}

try {
    app.allowRendererProcessReuse = false;

    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
    app.on("ready", () => setTimeout(createWindow, 400));

} catch (e) {
    // Catch Error
    // throw e;
}

function storeWindowState(store: Store) {
    const {
        width, height, x, y,
    } = win.getBounds();
    const isMaximized = win.isMaximized();
    store.set("windowBounds", {
        width, height, x, y, isMaximized,
    });
}
