import { Component, Input } from "@angular/core";
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import { Application } from "@nativescript/core";

@Component({
    selector: "app-navbar",
    templateUrl: "./navbar.component.html",
    styleUrls: ["./navbar.component.scss"],
})
export class NavbarComponent {
    @Input() public title = "AGView";
    onDrawerButtonTap(): void {
        const sideDrawer = Application.getRootView() as RadSideDrawer;
        sideDrawer.showDrawer();
    }
}
