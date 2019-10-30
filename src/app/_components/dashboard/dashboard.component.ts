import { Component, ElementRef, ViewChild } from "@angular/core";
import { SplitComponent } from "angular-split";
import { FileSystemFileEntry, NgxFileDropEntry } from "ngx-file-drop";
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

  @ViewChild("preview", {static: false}) private previewCanvasRef: ElementRef;
  @ViewChild("sidebar", {static: false}) private sidebar: ElementRef;
  @ViewChild("split", {static: false}) private split: SplitComponent;
  private previewCanvas: HTMLCanvasElement;
  private previewContext: CanvasRenderingContext2D;

  public ngAfterViewInit() {
    this.previewCanvas = this.previewCanvasRef.nativeElement;
    this.previewContext = this.previewCanvas.getContext("2d");
    this.split.dragProgress$.subscribe(() => {
      this.sizeCanvas();
    });
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
    this.currentSlide.video = document.createElement("video");
    this.currentSlide.video.src = "file:///" + this.currentSlide.path;
    this.currentSlide.video.width = 1920;
    this.currentSlide.video.height = 1080;
    this.sizeCanvas();
    this.currentSlide.video.play();
    this.renderFrame();
  }

  public sizeCanvas() {
    const parentWidth = this.sidebar.nativeElement.getClientRects()[0].width + 10;
    this.previewCanvas.width = parentWidth;
    this.previewCanvas.height = parentWidth * this.currentSlide.video.height / this.currentSlide.video.width;
  }

  public renderFrame() {
    if (this.currentSlide.video.paused || this.currentSlide.video.ended) {
      return;
    }

    this.previewContext.canvas.height = this.previewCanvas.height;
    this.previewContext.canvas.width = this.previewCanvas.width;

    const cw = this.previewCanvas.getClientRects()[0].width;
    const ch = this.previewCanvas.getClientRects()[0].height;

    this.previewContext.drawImage(this.currentSlide.video, 0, 0, 1920, 1080, 10, 10, cw, ch);
    const frame = this.previewContext.getImageData(0, 0, cw, ch);

    /* const l = frame.data.length / 4;
    for (let i = 0; i < l; i++) {
      const grey = (frame.data[i * 4 + 0] + frame.data[i * 4 + 1] + frame.data[i * 4 + 2]) / 3;
      frame.data[i * 4 + 0] = grey;
      frame.data[i * 4 + 1] = grey;
      frame.data[i * 4 + 2] = grey;
    } */

    this.previewContext.putImageData(frame, 0, 0);

    setTimeout(() => {
      this.renderFrame();
    }, 16);
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
