import { Component, ElementRef, NgZone, ViewChild } from "@angular/core";
import { SplitComponent } from "angular-split";
import * as avconv from "avconv";
import { remote } from "electron";
import * as fs from "fs";
import { FileSystemFileEntry, NgxFileDropEntry } from "ngx-file-drop";
import * as path from "path";
import * as smalltalk from "smalltalk";
import * as VideoContext from "videocontext";
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
  public readonly transitions: string[] = ["CROSSFADE", "DREAMFADE", "HORIZONTAL_WIPE", "RANDOM_DISSOLVE",
  "STAR_WIPE", "STATIC_DISSOLVE", "TO_COLOR_AND_BLACK"];
  public readonly thumbnailPercent: number = 8;
  private readonly crossfadeDuration: number = 1;

  @ViewChild("preview", {static: false}) private previewCanvasRef: ElementRef;
  @ViewChild("sidebar", {static: false}) private sidebar: ElementRef;
  @ViewChild("split", {static: false}) private split: SplitComponent;
  private previewCanvas: HTMLCanvasElement;
  private videoCtx: VideoContext;
  private currentNode: any;

  constructor(private zone: NgZone) { }

  public ngAfterViewInit() {

    this.previewCanvas = this.previewCanvasRef.nativeElement;
    this.split.dragProgress$.subscribe(() => {
      this.sizeCanvas();
    });
    this.videoCtx = new VideoContext(this.previewCanvas);
    // tslint:disable-next-line: max-line-length
    this.currentNode = this.videoCtx.image("assets/test.gif");
    this.currentNode.start(0);

    this.currentNode.connect(this.videoCtx.destination);

    this.videoCtx.play();
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
          encodedFiles.push(`${filename}.encoded.${extension}`);
        } else {
          unencodedFiles.push(`${filename}.${extension}`);
        }
      }
    }
    if (unencodedFiles.length > 0) {
      smalltalk.confirm("Unencoded files found", "Some files are not encoded in the best format to give the best\
      performance.\
      Press 'Ok' to encode them now.<br>If you already encoded them , please make sure that the files are called\
      'path/to/file/filename.encoded.ext'!")
      .then(() => {
        for (let index = 0; index < unencodedFiles.length; index++) {
          const file = unencodedFiles[index];
          const filename = file.replace(/\.[^/.]+$/, "");
          const extension = file.split(".").pop();
          const fileoutput = `${filename}.encoded.${extension}`;
          const params = [
            "-i", file,
            "-tune", "fastdecode",
            "-strict", "experimental",
            fileoutput,
          ];
          const os = "windows";
          const binfile = "avconv.exe";
          const stream = avconv(params, path.join(remote.app.getAppPath(), "bin", "avconv", os, binfile));
          const progress =
            smalltalk.progress("Encoding files", `Encoding file ${index + 1} of ${unencodedFiles.length}`);
          stream.on("message", (data: any) => {
              // console.log("message: ", data);
          });
          stream.on("progress", (p: any) => {
            this.zone.run(() => {
              progress.setProgress(Math.round(p * 100)).catch(() => {
                stream.kill();
              });
            });
          });
          // end when finished
        }
      })
      .catch(() => undefined);
    }
    // this.slides.push(new Slide("video", file.path, "CROSSFADE", 1));
  }

  public setCurrentSlide(event: any, slideIdx: number) {

    this.currentSlide = this.slides[slideIdx];

    const newNode = this.videoCtx.video(this.currentSlide.path);
    newNode.start(0);

    const crossFade = this.videoCtx.transition(VideoContext.DEFINITIONS[this.currentSlide.transition]);
    crossFade.transition(this.videoCtx.currentTime,
      this.videoCtx.currentTime + this.crossfadeDuration, 0.0, 1.0, "mix");

    this.currentNode.connect(crossFade);
    newNode.connect(crossFade);
    crossFade.connect(this.videoCtx.destination);

    setTimeout(() => {
      /* console.log(this.videoCtx);
      this.currentNode.disconnect(); */
      this.currentNode = newNode;
    }, (this.crossfadeDuration + 1) * 1000);

    // this.sizeCanvas();
  }

  public sizeCanvas() {
    const parentWidth = this.sidebar.nativeElement.getClientRects()[0].width + 10;
    this.previewCanvas.width = parentWidth;
    this.previewCanvas.height = parentWidth * 1080 / 1920;
    // console.log("Canvas sized to", this.previewCanvas.width, this.previewCanvas.height);
  }

  public mouseOverVideo(event, slideIdx: string | number) {
    const rect = event.target.getClientRects()[0];
    const x = ( event.clientX - rect.x ) / rect.width;
    event.target.currentTime = x * event.target.duration;
    this.slides[slideIdx].percent = x * 100;
  }

  public mouseLeave(event: { target: { querySelector: (arg0: string) => void; }; }, slideIdx: string | number) {
    this.slides[slideIdx].showProgressbar = false;
    const video = event.target.querySelector("video");
    this.seekToThumbnail(slideIdx, video);
  }

  private seekToThumbnail(slideIdx: any, video: any) {
    this.slides[slideIdx].percent = this.thumbnailPercent / video.duration;
    video.currentTime = this.thumbnailPercent / 100 * video.duration;
  }
}
