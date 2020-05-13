import { Injectable } from "@angular/core";
import { TitleService } from "./title.service";
import { Store } from "../_helpers/store";
import { remote } from "electron";

@Injectable({
    providedIn: "root"
})
export class SettingsService {
    public store = new Store({
        configName: "user-preferences",
        defaults: {
            openVideosDefaultPath: remote.app.getPath("home"),
        },
    });
}
