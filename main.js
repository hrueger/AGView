"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var path = require("path");
var url = require("url");
var obs_1 = require("./src/worker/obs");
var store_1 = require("./src/app/_helpers/store");
var win = null;
var obs = null;
var args = process.argv.slice(1), serve = args.some(function (val) { return val === "--serve"; });
function createWindow() {
    var size = electron_1.screen.getPrimaryDisplay().workAreaSize;
    var store = new store_1.Store({
        configName: "window-state",
        defaults: {
            windowBounds: {
                width: size.width / 2,
                height: size.height / 2,
                x: undefined,
                y: undefined,
                isMaximized: false,
            }
        }
    });
    var _a = store.get("windowBounds"), width = _a.width, height = _a.height, x = _a.x, y = _a.y, isMaximized = _a.isMaximized;
    win = new electron_1.BrowserWindow({
        width: width,
        height: height,
        x: x,
        y: y,
        icon: path.join(__dirname, "src/assets/icons/favicon.png"),
        webPreferences: {
            nodeIntegration: true,
            webSecurity: false,
            allowRunningInsecureContent: (serve) ? true : false,
        },
        frame: false,
        backgroundColor: "#1E1E1E",
    });
    if (isMaximized) {
        win.maximize();
    }
    win.on("resize", function () {
        storeWindowState(store);
    });
    win.on("move", function () {
        storeWindowState(store);
    });
    if (serve) {
        require("devtron").install();
        win.webContents.openDevTools();
        require("electron-reload")(__dirname, {
            electron: require(__dirname + "/node_modules/electron")
        });
        win.loadURL("http://localhost:4200");
    }
    else {
        win.loadURL(url.format({
            pathname: path.join(__dirname, "dist/index.html"),
            protocol: "file:",
            slashes: true
        }));
    }
    electron_1.ipcMain.on("obs-action", function (action) {
        var data = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            data[_i - 1] = arguments[_i];
        }
        switch (action) {
            case "initialize":
                if (obs) {
                    obs.shutdown();
                    obs = undefined;
                }
                obs = new obs_1.OBS(win);
                break;
            default:
                console.log("unknown event:", action, data);
        }
    });
    var projector;
    electron_1.ipcMain.on("preview-init", function (bounds) {
        electron_1.ipcMain.emit("preview-height", obs.setupPreview(win, bounds));
    });
    electron_1.ipcMain.on("preview-bounds", function (bounds) {
        electron_1.ipcMain.emit("preview-height", obs.resizePreview(bounds));
    });
    electron_1.ipcMain.on("projector-init", function () {
        obs.setupProjector(win);
    });
    electron_1.ipcMain.on("projector-end", function () {
        obs.endProjector();
    });
    electron_1.ipcMain.on("add-videos", function (videos) {
        obs.addFile(videos[0]);
    });
    // Emitted when the window is closed.
    win.on("closed", function () {
        // Dereference the window object, usually you would store window
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null;
    });
    return win;
}
try {
    electron_1.app.allowRendererProcessReuse = false;
    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
    electron_1.app.on("ready", function () { return setTimeout(createWindow, 400); });
    // Quit when all windows are closed.
    electron_1.app.on("window-all-closed", function () {
        // On OS X it is common for applications and their menu bar
        // to stay active until the user quits explicitly with Cmd + Q
        if (process.platform !== "darwin") {
            electron_1.app.quit();
        }
    });
    electron_1.app.on("activate", function () {
        // On OS X it"s common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (win === null) {
            createWindow();
        }
    });
}
catch (e) {
    // Catch Error
    // throw e;
}
function storeWindowState(store) {
    var _a = win.getBounds(), width = _a.width, height = _a.height, x = _a.x, y = _a.y;
    var isMaximized = win.isMaximized();
    store.set("windowBounds", { width: width, height: height, x: x, y: y, isMaximized: isMaximized });
}
//# sourceMappingURL=main.js.map