
import * as electron from "electron";
import * as path from "path";
import * as fs from "fs";

export class Store {
  path: any;
  data: any;
  constructor(opts) {
    const userDataPath = (electron.app || electron.remote.app).getPath("userData");
    this.path = path.join(userDataPath, opts.configName + ".json");
    
    this.data = parseDataFile(this.path, opts.defaults);
  }
  
  get(key) {
    return this.data[key];
  }
  
  set(key, val) {
    this.data[key] = val;
    fs.writeFileSync(this.path, JSON.stringify(this.data));
  }
}

function parseDataFile(filePath, defaults) {
  try {
    return JSON.parse(fs.readFileSync(filePath).toString());
  } catch(error) {
    return defaults;
  }
}