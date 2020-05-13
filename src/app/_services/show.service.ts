import { Injectable } from "@angular/core";
import { TitleService } from "./title.service";

@Injectable({
  providedIn: "root"
})
export class ShowService {
  addVideos(videos: string[]) {
    throw new Error("Method not implemented.");
  }
  private currentShowFile: string;
  private showLoaded: boolean = false;
  private showTitle: string = "Unnamed";
  constructor(private titleService: TitleService) {
    this.updateTitle();
  }

  private updateTitle() {
    this.titleService.setTitle(this.showTitle);
  }
}
