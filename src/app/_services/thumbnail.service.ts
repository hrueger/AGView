import { Injectable } from "@angular/core";
import * as path from "path";
import { remote } from "electron";
import * as fs from "fs";
import * as crypto from "crypto";
import * as thumbnail from "simple-thumbnail";
import { supportedFiles, SlideType } from "../_globals/supportedFilesFilters";

@Injectable({
    providedIn: "root",
})
export class ThumbnailService {
    private thumbnailPath = path.join(remote.app.getPath("userData"), "thumbnails");
    private ffmpegPath = path.join(__dirname, "../../../../../../bin", "ffmpeg.exe").replace("app.asar", "");

    constructor() {
        if (!fs.existsSync(this.thumbnailPath)) {
            fs.mkdirSync(this.thumbnailPath);
        }
    }

    public ensureThumbnail(file: string): Promise<string> {
        const hash = crypto.createHash("md5").update(file).digest("hex");
        const thumbnailPath = path.join(this.thumbnailPath, `${hash}.png`);
        if (this.ofType(file, "browser")) {
            return new Promise<string>((resolve, reject) => {
                let win = new remote.BrowserWindow({
                    show: false,
                });
                win.loadFile(file);
                win.webContents.on("did-stop-loading", () => {
                    win.capturePage().then((image) => {
                        fs.writeFile(thumbnailPath, image.toPNG(), (err) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(thumbnailPath);
                            }
                            win.close();
                            win = undefined;
                        });
                    });
                });
            });
        }
        if (this.ofType(file, "image")) {
            return new Promise((resolve) => {
                resolve(file);
            });
        }

        return new Promise<string>((resolve) => {
            if (!fs.existsSync(thumbnailPath)) {
                thumbnail(file, thumbnailPath, "250x?", {
                    path: this.ffmpegPath,
                }).then(() => {
                    resolve(thumbnailPath);
                });
            } else {
                resolve(thumbnailPath);
            }
        });
    }

    private ofType(file: any, type: SlideType) {
        return supportedFiles.find((f) => f.slideType == type).extensions.includes(path.extname(file).replace(".", ""));
    }
}
