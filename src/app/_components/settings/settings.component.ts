import { Component } from "@angular/core";
import { remote } from "electron";
import { SettingsService } from "../../_services/settings.service";

@Component({
    selector: "settings",
    templateUrl: "./settings.component.html",
    styleUrls: ["./settings.component.scss"],
})
export class SettingsComponent {
    public projector = false;
    public width: number;
    public height: number;
    public aspectRatioWidth: number;
    public aspectRatioHeight: number;
    public paddingSize: number;
    public linked = true;

    constructor(private settingsService: SettingsService) {
        this.width = this.settingsService.store.get("width");
        this.height = this.settingsService.store.get("height");
        this.aspectRatioWidth = this.settingsService.store.get("aspectRatioWidth");
        this.aspectRatioHeight = this.settingsService.store.get("aspectRatioHeight");
        this.paddingSize = this.settingsService.store.get("paddingSize");
    }

    public changed(f: "width" | "height" | "aspectRatioWidth" | "aspectRatioHeight") {
        if (this.linked) {
            if (f == "width") {
                this.height = Math.round(this.width
                    / (this.aspectRatioWidth / this.aspectRatioHeight));
            } else if (f == "height") {
                this.width = Math.round(this.height
                    * (this.aspectRatioWidth / this.aspectRatioHeight));
            }
        }
        if (f == "aspectRatioWidth") {
            this.width = Math.round(this.height
                * (this.aspectRatioWidth / this.aspectRatioHeight));
        } else if (f == "aspectRatioHeight") {
            this.height = Math.round(this.width
                / (this.aspectRatioWidth / this.aspectRatioHeight));
        }

        this.settingsService.store.set("width", this.width);
        this.settingsService.store.set("height", this.height);
        this.settingsService.store.set("aspectRatioWidth", this.aspectRatioWidth);
        this.settingsService.store.set("aspectRatioHeight", this.aspectRatioHeight);
        this.settingsService.store.set("paddingSize", this.paddingSize);
    }

    public toggleProjector() {
        if (this.projector) {
            remote.ipcMain.emit("projector-end");
        } else {
            remote.ipcMain.emit("projector-init");
        }
        this.projector = !this.projector;
    }
}
