class Slide {
    public type: "image" | "audio" | "video";
    public path: string;
    public order?: number;
    public percent?: number = 0;
    public showProgressbar?: boolean = false;
    public video?;

    constructor(type, path, order?) {
        this.type = type;
        this.path = path;
        this.order = order;
    }
}

export { Slide };
