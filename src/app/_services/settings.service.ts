import { Injectable } from "@angular/core";
import { remote } from "electron";
import { Store } from "../_helpers/store";

@Injectable({
    providedIn: "root",
})
export class SettingsService {
    public store = new Store({
        configName: "user-preferences",
        defaults: {
            openVideosDefaultPath: remote.app.getPath("home"),
            previewSplitSize: undefined,
            mainSplitSize: undefined,
        },
    });
}
