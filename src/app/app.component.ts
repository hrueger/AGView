import { Component } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { remote } from "electron";
import { ShowService } from "./_services/show.service";
import { TitlebarService } from "./_services/titlebar.service";
import { TitleService } from "./_services/title.service";

@Component({
    selector: "app-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.scss"],
})
export class AppComponent {
    constructor(
        private translate: TranslateService,
        private titlebarService: TitlebarService,
        private titleService: TitleService,
        private showService: ShowService,
    ) {
        translate.setDefaultLang("en");
        const win = remote.getCurrentWindow();
        win.on("close", () => {
            if (!this.showService.hasUnsavedChanges) {
                return;
            }
            this.showService.askToSaveChanges(win);
        });
    }
}
