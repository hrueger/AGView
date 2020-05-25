import { Save } from "../_decorators/save.decorator";
import { AlignmentOptions } from "./alignmentOptions";
import { SlideType } from "../_globals/supportedFilesFilters";

export class Slide {
    @Save
    public type: SlideType;

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
