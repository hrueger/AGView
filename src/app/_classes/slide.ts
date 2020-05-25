import { Save } from "../_decorators/save.decorator";
import { AlignmentOptions } from "./alignmentOptions";

export class Slide {
    @Save
    public type: "browser" | "video" | "image";

    @Save
    public filePath: string;

    @Save
    public name: string;

    @Save
    public id: string;

    @Save
    public alignment: AlignmentOptions;

    public thumbnail?: string;

    constructor() {
        this.alignment = {
            alignment: "center",
            padding: 0,
            scale: "fit",
        };
    }
}
