import { Injectable } from "@angular/core";
import { settingsStoreOptions } from "../_globals/settingsStoreOptions";
import { Store } from "../_helpers/store";

@Injectable({
    providedIn: "root",
})
export class SettingsService {
    public store = new Store(settingsStoreOptions);
}
