import { Component, OnInit, ViewChild, ChangeDetectionStrategy } from "@angular/core";
import { Router } from "@angular/router";
import { remote, ipcRenderer, ipcMain, app } from "electron";
import { PreviewComponent } from "../preview/preview.component";
import { SplitComponent } from 'angular-split';

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {

  @ViewChild("preview") private preview: PreviewComponent;
  @ViewChild("mainSplit") public mainSplit: SplitComponent;
  @ViewChild("rightSplit") public rightSplit: SplitComponent;
  constructor(private router: Router) { }

  ngOnInit() {
    
    remote.ipcMain.emit("obs-action", "initialize", "test", "cool");
  }
  ngAfterViewInit(): void {
    this.mainSplit.dragProgress$.subscribe((e) => {
      this.preview.onResized(e);
    });
    this.rightSplit.dragProgress$.subscribe((e) => {
      this.preview.onResized(e);
    });
    /*.on("performanceStatistics", (d) => {
      console.log(d);
    })*/
  }

}
