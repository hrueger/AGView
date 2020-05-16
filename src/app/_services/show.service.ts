import { Injectable } from "@angular/core";
import { remote } from "electron";
import * as fs from "fs";
import { TitleService } from "./title.service";
import { hasDecorator } from "../_helpers/hasDecorator";

@Injectable({
    providedIn: "root",
})
export class ShowService {
    private unsavedChanges = false;
    public addVideos(videos: string[]) {
        remote.ipcMain.emit("add-videos", videos);
    }
    private currentShowFile: string;
    private showLoaded = false;
    private pshowTitle = "Unnamed";

    private data: any = {};

    constructor(private titleService: TitleService) {
        this.updateTitle();
    }

    public get hasUnsavedChanges() {
        return this.unsavedChanges;
    }

    public get showTitle() {
        return this.pshowTitle;
    }

    public setData(key, data) {
        if (Array.isArray(data)) {
            data = data.map((d) => {
                if (typeof d === "object") {
                    return this.filterSaveProperties(d);
                }
                return d;
            })
        } else if (typeof data === "object") {
            data = this.filterSaveProperties(data);
        }
        this.data[key] = data;
        this.setHasUnsavedChanges(true);
    }

    private filterSaveProperties(data: any): any {
        // @ts-ignore
        return Object.fromEntries(
            Object.entries(data).filter(
                ([key, val]) => {
                    return hasDecorator(data, key, "save");
                }
            )
        );
    }

    public save(): boolean {
        if (!this.currentShowFile) {
            this.currentShowFile = remote.dialog.showSaveDialogSync({
                title: "Save as",
                filters: [{
                    name: "AGView Show File",
                    extensions: ["agvshow"],
                }],
            });
            if (!this.currentShowFile) {
                return false;
            }
        }
        this.writeShowFile();
        return true;
    }

    
    new() {
        //
    }
    open() {
        //
    }
    saveAs() {
        //
    }

    private writeShowFile() {
        fs.writeFileSync(this.currentShowFile, JSON.stringify(this.data));
        this.setHasUnsavedChanges(false);
    }

    private setHasUnsavedChanges(u) {
        this.unsavedChanges = u;
        this.updateTitle();
    }

    private updateTitle() {
        this.titleService.setTitle(this.pshowTitle, this.hasUnsavedChanges);
    }
}
