import { Injectable } from "@angular/core";
import { remote } from "electron";
import * as fs from "fs";
import { BehaviorSubject } from "rxjs";
import * as path from "path";
import { hasDecorator } from "../_helpers/hasDecorator";
import { filters } from "../_globals/globals";

@Injectable({
    providedIn: "root",
})
export class ShowService {
    private unsavedChanges = false;
    public data: BehaviorSubject<any> = new BehaviorSubject<any>({});
    public addVideos(videos: string[]) {
        remote.ipcMain.emit("add-videos", videos);
    }
    private currentShowFile: string;
    private showLoaded = false;
    private pshowTitle = "Unnamed";

    private pdata: any = {};

    public titleData: BehaviorSubject<{ title: string; hasUnsavedChanges: boolean }> = new BehaviorSubject({ title: "", hasUnsavedChanges: false });

    constructor() {
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
            });
        } else if (typeof data === "object") {
            data = this.filterSaveProperties(data);
        }
        this.pdata[key] = data;
        this.setHasUnsavedChanges(true);
    }

    private filterSaveProperties(data: any): any {
        // @ts-ignore
        return Object.fromEntries(
            Object.entries(data).filter(
                ([key]) => hasDecorator(data, key, "save"),
            ),
        );
    }

    public save(): boolean {
        if (!this.currentShowFile) {
            this.showSaveAsDialog();
            if (!this.currentShowFile) {
                return false;
            }
        }
        this.writeShowFile();
        return true;
    }

    public new() {
        if (this.unsavedChanges) {
            this.askToSaveChanges(remote.getCurrentWindow());
        }
        this.titleData.next({ title: "Unnamed", hasUnsavedChanges: false });
        this.pdata = {};
        this.data.next(this.pdata);
    }

    public open() {
        this.ensureNoUnsavedChanges();
        const file = remote.dialog.showOpenDialogSync({
            filters,
            title: "Open show",
            properties: ["openFile"],
        });
        if (file && file[0] && fs.existsSync(file[0])) {
            try {
                this.pdata = JSON.parse(fs.readFileSync(file[0]).toString());
            } catch (e) {
                // eslint-disable-next-line no-alert
                alert("The file couldn't be opened.");
                // eslint-disable-next-line no-console
                console.log(e);
                return;
            }
            [this.currentShowFile] = file;
            this.data.next(this.pdata);
            this.pshowTitle = path.basename(this.currentShowFile);
            this.updateTitle();
        }
    }

    public saveAs() {
        const origShowFile = this.currentShowFile;
        this.showSaveAsDialog();
        if (origShowFile != this.currentShowFile) {
            this.writeShowFile();
        }
    }

    public askToSaveChanges(win) {
        const choice = remote.dialog.showMessageBoxSync(win,
            {
                type: "question",
                buttons: ["Save", "Don't save"],
                title: "AGView",
                message: `Do you want to save your changes to "${this.showTitle}"?\n\nIf you press "No", your changes will be discarded.`,
            });

        if (choice == 0) {
            this.save();
        }
    }

    private writeShowFile() {
        fs.writeFileSync(this.currentShowFile, JSON.stringify(this.pdata));
        this.setHasUnsavedChanges(false);
        this.pshowTitle = path.basename(this.currentShowFile);
        this.updateTitle();
    }

    private setHasUnsavedChanges(u) {
        this.unsavedChanges = u;
        this.updateTitle();
    }

    private ensureNoUnsavedChanges() {
        if (this.unsavedChanges) {
            this.askToSaveChanges(remote.getCurrentWindow());
        }
    }

    private updateTitle() {
        this.titleData.next({
            title: this.pshowTitle,
            hasUnsavedChanges: this.hasUnsavedChanges,
        });
    }

    private showSaveAsDialog() {
        this.currentShowFile = remote.dialog.showSaveDialogSync({
            title: "Save as",
            filters,
        });
    }
}
