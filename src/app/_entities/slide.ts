class Slide {
    public type: "image" | "audio" | "video";
    public path: string;
    public order?: number;
    public percent?: number = 0;
    public showProgressbar?: boolean = false;
    public video?;
    public transition: "CROSSFADE" | "DREAMFADE" | "HORIZONTAL_WIPE" |
    "RANDOM_DISSOLVE" | "STAR_WIPE" | "STATIC_DISSOLVE" | "TO_COLOR_AND_BLACK";

    constructor(type: "image" | "audio" | "video",
                path: string, transition: "CROSSFADE" | "DREAMFADE" | "HORIZONTAL_WIPE" |
                // tslint:disable-next-line: align
                "RANDOM_DISSOLVE" | "STAR_WIPE" | "STATIC_DISSOLVE" | "TO_COLOR_AND_BLACK", order?: number) {
        this.type = type;
        this.path = path;
        this.order = order;
        // @ts-ignore
        this.transition = transition;
    }
}

export { Slide };
