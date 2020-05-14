import { Injectable } from "@angular/core";
import { TitleService } from "./title.service";
import { remote } from "electron";

@Injectable({
  providedIn: "root"
})
export class ShowService {
  public addVideos(videos: string[]) {
    remote.ipcMain.emit("add-videos", videos);
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
