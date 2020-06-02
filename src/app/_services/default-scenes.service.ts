import { Injectable } from "@angular/core";
import { remote } from "electron";

@Injectable({
    providedIn: "root",
})
export class DefaultScenesService {
    public transitionTo(slide: "black" | "logo" | "customLogo") {
        remote.ipcMain.emit("transition-to-default-slide", slide);
    }
}
