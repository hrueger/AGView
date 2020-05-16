import { Injectable } from "@angular/core";
import { remote } from "electron";
import { TitlebarService } from "./titlebar.service";

@Injectable({
    providedIn: "root",
})
export class TitleService {
  private title = "";
  constructor(private titlebarService: TitlebarService) {
      this.updateTitle();
  }

  public setTitle(t, hasUnsavedChanges = false) {
      this.title = `${hasUnsavedChanges ? "● " : ""}${t ? `${t} - ` : ""}AGView`;
      this.updateTitle();
  }

  private updateTitle() {
      for (const win of remote.BrowserWindow.getAllWindows()) {
          win.setTitle(this.title);
      }
      this.titlebarService.setTitle(this.title);
  }
}
