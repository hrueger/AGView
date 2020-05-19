import { Component } from "@angular/core";
import { remote } from "electron";
import { SettingsService } from "../../_services/settings.service";
import { reduceFraction } from "../../_helpers/reduceFraction";

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
    public backgroundColor: string;
    public linked = true;

    constructor(private settingsService: SettingsService) {
        this.width = this.settingsService.store.get("width");
        this.height = this.settingsService.store.get("height");
        this.aspectRatioWidth = this.settingsService.store.get("aspectRatioWidth");
        this.aspectRatioHeight = this.settingsService.store.get("aspectRatioHeight");
        this.paddingSize = this.settingsService.store.get("paddingSize");
        this.backgroundColor = this.settingsService.store.get("backgroundColor");
    }

    private updateAspectRatio() {
        console.log(reduceFraction(this.width, this.height));
        const [w, h] = reduceFraction(this.width, this.height);
        this.aspectRatioWidth = Math.round(w);
        this.aspectRatioHeight = Math.round(h);
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
        } else if (f == "height" || f == "width") {
            this.updateAspectRatio();
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
        this.settingsService.store.set("backgroundColor", this.backgroundColor);
        remote.ipcMain.emit("settings-changed");
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
