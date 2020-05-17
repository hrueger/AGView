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
        win.on("close", (e) => {
            if (!this.showService.hasUnsavedChanges) {
                return;
            }
            const choice = remote.dialog.showMessageBoxSync(win,
                {
                    type: "question",
                    buttons: ["Save", "Don't save"],
                    title: "AGView",
                    message: `Do you want to save your changes to "${this.showService.showTitle}"?\n\nIf you press "No", your changes will be discarded.`,
                });
            if (choice == 0) {
                e.preventDefault();
                this.showService.save();
            }
        });
    }
}
