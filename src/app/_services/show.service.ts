import { Injectable } from "@angular/core";
import { remote } from "electron";
import { TitleService } from "./title.service";

@Injectable({
    providedIn: "root",
})
export class ShowService {
    public addVideos(videos: string[]) {
        remote.ipcMain.emit("add-videos", videos);
    }
  private currentShowFile: string;
  private showLoaded = false;
  private showTitle = "Unnamed";
  constructor(private titleService: TitleService) {
      this.updateTitle();
  }

  private updateTitle() {
      this.titleService.setTitle(this.showTitle);
  }
}
