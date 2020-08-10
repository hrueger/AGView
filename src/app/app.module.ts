import "reflect-metadata";
import "../polyfills";

import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { HttpClientModule, HttpClient } from "@angular/common/http";
import { DragulaModule } from "ng2-dragula";
import { QRCodeModule } from "angularx-qrcode";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";

// NG Translate
import { TranslateModule, TranslateLoader } from "@ngx-translate/core";
import { TranslateHttpLoader } from "@ngx-translate/http-loader";
import { AngularSplitModule } from "angular-split";
import { AppRoutingModule } from "./app-routing.module";

import { AppComponent } from "./app.component";
import { HomeComponent } from "./_components/home/home.component";
import { PreviewComponent } from "./_components/preview/preview.component";
import { SettingsComponent } from "./_components/settings/settings.component";
import { StatusbarComponent } from "./_components/statusbar/statusbar.component";

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
    return new TranslateHttpLoader(http, "./assets/i18n/", ".json");
}

@NgModule({
    declarations: [
        AppComponent,
        HomeComponent,
        PreviewComponent,
        SettingsComponent,
        StatusbarComponent,
    ],
    imports: [
        BrowserModule,
        FormsModule,
        HttpClientModule,
        AppRoutingModule,
        AngularSplitModule.forRoot(),
        DragulaModule,
        NgbModule,
        QRCodeModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient],
            },
        }),
    ],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {}
