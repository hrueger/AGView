import { Injectable } from "@angular/core";
import { remote } from "electron";
import * as fs from "fs";
import { Store } from "../_helpers/store";

@Injectable({
    providedIn: "root",
})
export class RecentShowsService {
    private store = new Store({
        configName: "recent-shows",
        defaults: {
            recentShows: [],
        },
    });
    private recentShows: string[] = [];

    constructor() {
        this.recentShows = this.store.get("recentShows");
        const origLength = this.recentShows.length;
        this.recentShows.filter((path) => fs.existsSync(path));
        if (this.recentShows.length != origLength) {
            this.save();
        }
    }

    public add(path) {
        if (fs.existsSync(path)) {
            remote.app.addRecentDocument(path);
            this.recentShows.push(path);
            this.save();
        }
    }

    public get() {
        return this.recentShows;
    }

    private save() {
        this.store.set("recentShows", this.recentShows);
    }
}
