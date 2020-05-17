import { join } from "path";
import { readFileSync } from "fs";
import { rootPath } from "electron-root-path";

let _pkginfo: any = {};

  // @ts-ignore
if (typeof PKG_INFO !== "undefined" && PKG_INFO !== null) {
  // @ts-ignore
  _pkginfo = PKG_INFO;
} else {
  _pkginfo = JSON.parse(
    readFileSync(join(rootPath, "package.json"), { encoding: "utf8" })
  );
}

export const pkginfo = _pkginfo;