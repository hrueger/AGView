import { remote, app } from "electron";

export const settingsStoreOptions = {
    configName: "user-preferences",
    defaults: {
        openVideosDefaultPath: (app || remote.app).getPath("home"),
        previewSplitSize: undefined,
        mainSplitSize: undefined,
        width: 1920,
        height: 1080,
        aspectRatioWidth: 16,
        aspectRatioHeight: 9,
        paddingSize: 0,
    },
};
