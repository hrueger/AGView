export class Slide {
  public type: "browser" | "video" | "image";
  public filePath: string;
  public thumbnail?: string;
  public name: string;
}