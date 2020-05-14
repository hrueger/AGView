import { Component, OnInit, ViewChild, ChangeDetectionStrategy } from "@angular/core";
import { Router } from "@angular/router";
import { remote } from "electron";
import { PreviewComponent } from "../preview/preview.component";
import { SettingsService } from "../../_services/settings.service";
import { SplitComponent } from "angular-split";
import * as path from "path";
import { ShowService } from "../../_services/show.service";

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  public mainSplitSize: number;
  public previewSplitSize: number;
  @ViewChild("preview") private preview: PreviewComponent;
  @ViewChild("mainSplit") public mainSplit: SplitComponent;
  @ViewChild("rightSplit") public rightSplit: SplitComponent;
  constructor(private settingsService: SettingsService, private showService: ShowService) {
    this.mainSplitSize =  this.settingsService.store.get("mainSplitSize");;
    this.previewSplitSize =  this.settingsService.store.get("previewSplitSize");;
  }

  ngOnInit() {
    
    remote.ipcMain.emit("obs-action", "initialize", "test", "cool");
  }
  ngAfterViewInit(): void {
    this.mainSplit.dragProgress$.subscribe((e) => {
      this.storeSplitSizes();
      this.preview.onResized(e);
    });
    this.rightSplit.dragProgress$.subscribe((e) => {
      this.storeSplitSizes();
      this.preview.onResized(e);
    });
    /*.on("performanceStatistics", (d) => {
      console.log(d);
    })*/
  }

  private storeSplitSizes() {
    this.settingsService.store.set("mainSplitSize", this.mainSplit.displayedAreas[1].size);
    this.settingsService.store.set("previewSplitSize", this.rightSplit.displayedAreas[1].size);
  }

  public addVideos() {
    const videos = remote.dialog.showOpenDialogSync({
      title: "Add video files",
      filters: [
        { name: "Movies", extensions: ["mkv", "avi", "mp4"] },
      ],
      defaultPath: this.settingsService.store.get("openVideosDefaultPath"),
    });
    if (!videos || videos.length == 0) {
      return;
    }
    this.settingsService.store.set("openVideosDefaultPath", path.basename(videos[0]));
    this.showService.addVideos(videos);
  }
}
