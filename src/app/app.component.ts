import { Component } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { ShowService } from "./_services/show.service";

@Component({
    selector: "app-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.scss"],
})
export class AppComponent {
    constructor(
    private translate: TranslateService,
    private showService: ShowService,
    ) {
        translate.setDefaultLang("en");
    }
}
