import * as electron from "electron";
import * as path from "path";
import * as fs from "fs";

export class Store {
    path: any;
    data: any;
    defaults: any;
    constructor(opts) {
        const userDataPath = (electron.app || electron.remote.app).getPath("userData");
        this.defaults = opts.defaults;
        this.path = path.join(userDataPath, `${opts.configName}.json`);

        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        this.data = parseDataFile(this.path, opts.defaults);
    }

    get(key) {
        return this.data[key] === undefined && this.defaults[key] !== undefined
            ? this.defaults[key]
            : this.data[key];
    }

    set(key, val) {
        this.data[key] = val;
        fs.writeFileSync(this.path, JSON.stringify(this.data));
    }
}

function parseDataFile(filePath, defaults) {
    try {
        return JSON.parse(fs.readFileSync(filePath).toString());
    } catch (error) {
        return defaults;
    }
}
