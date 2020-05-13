import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { remote } from "electron";
import ResizeObserver from "resize-observer-polyfill";

@Component({
  selector: "preview",
  templateUrl: "./preview.component.html",
  styleUrls: ["./preview.component.scss"]
})
export class PreviewComponent {

  @ViewChild("previewContainer") private container: ElementRef<HTMLDivElement>;
  constructor() { }

  public ngAfterViewInit(): void {
    remote.getCurrentWindow().on("resize", this.resizePreview(this.container));
    console.log(this.container);
    document.addEventListener("scroll", this.resizePreview(this.container));
    remote.ipcMain.on("preview-height", (h: any) => {
      this.container.nativeElement.style.height = `${h.height}px`;
    });
    this.resizePreview(this.container.nativeElement)();
  }

  private resizePreview(container) {
    return () => {
      const { width, height, x, y } = container.nativeElement.getBoundingClientRect();
      remote.ipcMain.emit("preview-bounds", { width, height, x, y });
    }
  }

}
