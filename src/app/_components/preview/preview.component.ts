import { Component, ViewChild, ElementRef } from "@angular/core";
import { remote } from "electron";

@Component({
    selector: "preview",
    templateUrl: "./preview.component.html",
    styleUrls: ["./preview.component.scss"],
})
export class PreviewComponent {
  @ViewChild("previewContainer") private container: ElementRef<HTMLDivElement>;

  public ngAfterViewInit(): void {
      remote.getCurrentWindow().on("resize", this.resizePreview(this.container));
      document.addEventListener("scroll", this.resizePreview(this.container));
      const {
          width, height, x, y,
      } = this.container.nativeElement.getBoundingClientRect();
      remote.ipcMain.emit("preview-init", {
          width, height, x, y,
      });
  }

  private resizePreview(container) {
      return () => {
          const {
              width, height, x, y,
          } = container.nativeElement.getBoundingClientRect();
          remote.ipcMain.emit("preview-bounds", {
              width, height, x, y,
          });
      };
  }

  public onResized() {
      this.resizePreview(this.container)();
  }
}
