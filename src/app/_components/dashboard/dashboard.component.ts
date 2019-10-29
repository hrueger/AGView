import { Component } from "@angular/core";
import { FileSystemFileEntry, NgxFileDropEntry } from "ngx-file-drop";
import { Slide } from "../../_entities/slide";

@Component({
  selector: "app-dashboard",
  styleUrls: ["./dashboard.component.scss"],
  templateUrl: "./dashboard.component.html",
})
export class DashboardComponent {

  public slides: Slide[] = [];
  public readonly thumbnailTime: number = 10;

  public dropped(files: NgxFileDropEntry[]) {
    for (const droppedFile of files) {
      if (droppedFile.fileEntry.isFile) {
        const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
        fileEntry.file((file: File) => {
          this.slides.push(new Slide("video", file.path, 1));
        });
      }
    }
  }

  public mouseOverVideo(event, slideIdx) {
    const rect = event.target.getClientRects()[0];
    const x = ( event.clientX - rect.x ) / rect.width;
    event.target.currentTime = x * event.target.duration;
    this.slides[slideIdx].percent = x * 100;
  }

  public mouseLeave(event, slideIdx) {
    this.slides[slideIdx].showProgressbar = false;
    const video = event.target.querySelector("video");
    this.slides[slideIdx].percent = this.thumbnailTime / video.duration * 100;
    video.currentTime = this.thumbnailTime;
  }
}
