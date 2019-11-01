import { Component, ElementRef, ViewChild } from "@angular/core";
import { SplitComponent } from "angular-split";
import { FileSystemFileEntry, NgxFileDropEntry } from "ngx-file-drop";
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

  public dropped(files: NgxFileDropEntry[]) {
    for (const droppedFile of files) {
      if (droppedFile.fileEntry.isFile) {
        const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
        fileEntry.file((file: File) => {
          this.slides.push(new Slide("video", file.path, "CROSSFADE", 1));
        });
      }
    }
  }

  public setCurrentSlide(event, slideIdx: number) {

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

  public mouseOverVideo(event, slideIdx) {
    const rect = event.target.getClientRects()[0];
    const x = ( event.clientX - rect.x ) / rect.width;
    event.target.currentTime = x * event.target.duration;
    this.slides[slideIdx].percent = x * 100;
  }

  public mouseLeave(event, slideIdx) {
    this.slides[slideIdx].showProgressbar = false;
    const video = event.target.querySelector("video");
    this.seekToThumbnail(slideIdx, video);
  }

  private seekToThumbnail(slideIdx: any, video: any) {
    this.slides[slideIdx].percent = this.thumbnailPercent / video.duration;
    video.currentTime = this.thumbnailPercent / 100 * video.duration;
  }
}
