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
  public readonly thumbnailTime: number = 10;
  private readonly crossfadeDuration: number = 1;

  @ViewChild("preview", {static: false}) private previewCanvasRef: ElementRef;
  @ViewChild("sidebar", {static: false}) private sidebar: ElementRef;
  @ViewChild("split", {static: false}) private split: SplitComponent;
  private previewCanvas: HTMLCanvasElement;
  private videoCtx: VideoContext;
  private currentVideoNode: any;
  private nextVideoNode: any;

  public ngAfterViewInit() {
    this.previewCanvas = this.previewCanvasRef.nativeElement;
    this.split.dragProgress$.subscribe(() => {
      this.sizeCanvas();
    });
    this.videoCtx = new VideoContext(this.previewCanvas);
    // tslint:disable-next-line: max-line-length
    this.currentVideoNode = this.videoCtx.video("C:\\Users\\Hannes\\Desktop\\fertig\\Schule\\Allgaeu-Robotics_Trailer.mp4");
    this.currentVideoNode.start(0);

    const crossFade = this.videoCtx.transition(VideoContext.DEFINITIONS.CROSSFADE);
    crossFade.transition(0, 0, 0.0, 1.0, "mix");

    this.currentVideoNode.connect(crossFade);
    this.currentVideoNode.connect(crossFade);
    crossFade.connect(this.videoCtx.destination);

    this.videoCtx.play();
  }

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

  public setCurrentSlide(event, slideIdx: number) {
    this.currentSlide = this.slides[slideIdx];

    this.nextVideoNode = this.videoCtx.video("C:\\Users\\Hannes\\Desktop\\fertig\\Schule\\multimediaAG-presents.mp4");
    this.nextVideoNode.start(0);

    const crossFade = this.videoCtx.transition(VideoContext.DEFINITIONS.CROSSFADE);
    crossFade.transition(this.videoCtx.currentTime,
      this.videoCtx.currentTime + this.crossfadeDuration, 0.0, 1.0, "mix");

    this.currentVideoNode.connect(crossFade);
    this.nextVideoNode.connect(crossFade);
    crossFade.connect(this.videoCtx.destination);

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
    this.slides[slideIdx].percent = this.thumbnailTime / video.duration * 100;
    video.currentTime = this.thumbnailTime;
  }
}
