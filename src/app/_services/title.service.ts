import { Injectable } from "@angular/core";
import { remote } from "electron";
import { TitlebarService } from "./titlebar.service";
import { ShowService } from "./show.service";

@Injectable({
    providedIn: "root",
})
export class TitleService {
    private title = "";
    constructor(private titlebarService: TitlebarService, private showService: ShowService) {
        this.updateTitle();
        this.showService.titleData.subscribe((d) => {
            this.setTitle(d.title, d.hasUnsavedChanges)
        });
        console.log("subscribed");
        this.setTitle(this.showService.titleData.value.title, this.showService.titleData.value.hasUnsavedChanges)
    }

    public setTitle(t, hasUnsavedChanges = false) {
        console.log("SET TITLE!");
        this.title = `${hasUnsavedChanges ? "● " : ""}${t ? `${t} - ` : ""}AGView`;
        this.updateTitle();
    }

    private updateTitle() {
        for (const win of remote.BrowserWindow.getAllWindows()) {
            win.setTitle(this.title);
        }
        this.titlebarService.setTitle(this.title);
    }
}
