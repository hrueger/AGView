import { remote, app } from "electron";
import * as path from "path";

export const settingsStoreOptions = {
    configName: "user-preferences",
    defaults: {
        importSlideDefaultPath: (app || remote.app).getPath("home"),
        previewSplitSize: undefined,
        mainSplitSize: undefined,
        width: 1920,
        height: 1080,
        aspectRatioWidth: 16,
        aspectRatioHeight: 9,
        paddingSize: 0,
        backgroundColor: "#000",
        customLogo: path.join(__dirname, "../../assets/icons/favicon.png"),
    },
};
