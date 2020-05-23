import { Save } from "../_decorators/save.decorator";

export class Slide {
  @Save
  public type: "browser" | "video" | "image";

  @Save
  public filePath: string;

  @Save
  public name: string;

  @Save
  public id: string;

  public thumbnail?: string;
}
