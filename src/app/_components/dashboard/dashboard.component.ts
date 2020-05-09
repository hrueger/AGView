import { Component, ElementRef, NgZone, ViewChild } from "@angular/core";
import { SplitComponent } from "angular-split";
import { remote } from "electron";
import * as fs from "fs";
import { FileSystemFileEntry, NgxFileDropEntry } from "ngx-file-drop";
import * as path from "path";
import * as smalltalk from "smalltalk";
import { Slide } from "../../_entities/slide";

@Component({
  selector: "app-dashboard",
  styleUrls: ["./dashboard.component.scss"],
  templateUrl: "./dashboard.component.html",
})
export class DashboardComponent {
  public slides: Slide[] = [];
  public currentSlide: Slide;
  public nextSlide: Slide;

  @ViewChild("preview", {static: false}) private previewCanvasRef: ElementRef;
  @ViewChild("sidebar", {static: false}) private sidebar: ElementRef;
  @ViewChild("split", {static: false}) private split: SplitComponent;
  private currentNode: any;

  constructor(private zone: NgZone) { }

  public ngAfterViewInit() {
    this.split.dragProgress$.subscribe(() => {
      this.sizeCanvas();
    });
  }

  public fileEntryToFile(fileEntry: FileSystemFileEntry) {
      return new Promise<File>((resolve, reject) => {
        fileEntry.file((file: File) => {
              resolve(file);
          });
      });
  }

  public async dropped(files: NgxFileDropEntry[]) {
    const encodedFiles: string[] = [];
    const unencodedFiles: string[] = [];

    for (const droppedFile of files) {
      if (droppedFile.fileEntry.isFile) {
        const file = await this.fileEntryToFile(droppedFile.fileEntry as FileSystemFileEntry);
        const filename = file.path.replace(/\.[^/.]+$/, "");
        const extension = file.path.split(".").pop();
        if (filename.endsWith("encoded")) {
          encodedFiles.push(`${filename}.${extension}`);
        } else if (fs.existsSync(`${filename}.encoded.${extension}`)) {
          const src = `${filename}.encoded.${extension}`;
          encodedFiles.push(src);
          this.addVideoSlide(src);
        } else {
          unencodedFiles.push(`${filename}.${extension}`);
        }
      }
    }
  }

  public setCurrentSlide(event: any, slideIdx: number) {

  }

  public sizeCanvas() {
    
  }
  private addVideoSlide(outputFile: string) {
    this.slides.push(new Slide("video", outputFile, "CROSSFADE", 1));
  }
}
