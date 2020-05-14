import { Injectable } from "@angular/core";
import * as path from "path";
import { remote } from "electron";
import * as fs from "fs";
import * as os from "os";
import * as crypto from "crypto";
import * as thumbnail from "simple-thumbnail";

@Injectable({
    providedIn: "root"
})
export class ThumbnailService {
    private thumbnailPath = path.join(remote.app.getPath("userData"), "thumbnails");
    private ffmpegPath = path.join(__dirname, "../../../../../../bin", os.platform(), os.arch(), os.platform() == "win32" ? "ffmpeg.exe" : "ffmpeg");

    constructor() {
        if (!fs.existsSync(this.thumbnailPath)) {
            fs.mkdirSync(this.thumbnailPath);
        }
    }

    public ensureThumbnail(videoPath): Promise<string> {
        console.log("started")
        return new Promise<string>((resolve) => {
            const hash = crypto.createHash("md5").update(videoPath).digest("hex");
            const thumbnailPath = path.join(this.thumbnailPath, `${hash}.png`);
            if (!fs.existsSync(thumbnailPath)) {
                thumbnail(videoPath, thumbnailPath, "250x?", {
                    path: this.ffmpegPath,
                }).then(() => {
                    console.log("done")
                    resolve(thumbnailPath);
                });
            } else {
                resolve(thumbnailPath);
            }
        });
    }
}
