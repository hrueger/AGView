import { Component, ChangeDetectorRef } from "@angular/core";
import { ipcRenderer } from "electron";
import { pkginfo } from "../../_helpers/packageInfo";

@Component({
    selector: "statusbar",
    templateUrl: "./statusbar.component.html",
    styleUrls: ["./statusbar.component.scss"],
})
export class StatusbarComponent {
    public statistics = {};
    public version = pkginfo.version;
    constructor(private cdr: ChangeDetectorRef) {}
    public ngOnInit() {
        ipcRenderer.on("performanceStatistics", (_, s) => {
            s.frameRate = s.frameRate ? Math.round(s.frameRate) : "  ";
            Object.assign(this.statistics, s);
            this.cdr.detectChanges();
            console.log(s);
        });
    }
}
