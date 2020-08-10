import {
    Component, Input, Output, EventEmitter,
} from "@angular/core";
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import { Application } from "@nativescript/core";

@Component({
    selector: "app-navbar",
    templateUrl: "./navbar.component.html",
    styleUrls: ["./navbar.component.scss"],
})
export class NavbarComponent {
    @Input() public title = "AGView";
    @Input() public isShow = false;
    @Output() public layoutChanged: EventEmitter<"grid" | "list"> = new EventEmitter<"grid"|"list">();
    public gridLayout = false;
    onDrawerButtonTap(): void {
        const sideDrawer = Application.getRootView() as RadSideDrawer;
        sideDrawer.showDrawer();
    }

    public toggleLayout() {
        this.gridLayout = !this.gridLayout;
        this.layoutChanged.emit(this.gridLayout ? "grid" : "list");
    }
}
