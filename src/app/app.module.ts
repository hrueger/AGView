import { HttpClientModule } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { AngularSplitModule } from "angular-split";
import { NgxFileDropModule } from "ngx-file-drop";
import { PERFECT_SCROLLBAR_CONFIG, PerfectScrollbarConfigInterface,
  PerfectScrollbarModule } from "ngx-perfect-scrollbar";
import { DashboardComponent } from "./_components/dashboard/dashboard.component";
import { NavbarComponent } from "./_components/navbar/navbar.component";
import { PathToSlideNamePipe } from "./_pipes/path-to-slide-name.pipe";
import { PrettyTransitionNamePipe } from "./_pipes/pretty-transition-name.pipe";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollX: true,
};

@NgModule({
  bootstrap: [AppComponent],
  declarations: [
    AppComponent,
    DashboardComponent,
    NavbarComponent,
    PathToSlideNamePipe,
    PrettyTransitionNamePipe,
  ],
  imports: [
    BrowserModule,
    PerfectScrollbarModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule,
    AngularSplitModule.forRoot(),
    NgxFileDropModule,
  ],
  providers: [
    {
      provide: PERFECT_SCROLLBAR_CONFIG,
      useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG,
    },
  ],
})
export class AppModule {}
