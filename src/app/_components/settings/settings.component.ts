import { Component } from "@angular/core";
import { remote } from "electron";

@Component({
    selector: "settings",
    templateUrl: "./settings.component.html",
    styleUrls: ["./settings.component.scss"],
})
export class SettingsComponent {
    public projector = false;

    public toggleProjector() {
        if (this.projector) {
            remote.ipcMain.emit("projector-end");
        } else {
            remote.ipcMain.emit("projector-init");
        }
        this.projector = !this.projector;
    }
}
