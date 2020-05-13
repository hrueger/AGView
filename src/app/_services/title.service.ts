import { Injectable } from "@angular/core";
import { remote } from "electron";

@Injectable({
  providedIn: "root"
})
export class TitleService {
  private title: string = "";
  constructor() {
    this.updateTitle();
  }

  public setTitle(t) {
    this.title = `${t ? `${t} - ` : ""}AGView`
    this.updateTitle();
  }
  
  private updateTitle() {
    for (const win of remote.BrowserWindow.getAllWindows()) {
      win.setTitle(this.title);
    }
    /*setTimeout(() => {
      //@ts-ignore
      console.log(window);
      window.titlebar.setTitle(this.title);
    }, 5000);*/
  }
}
