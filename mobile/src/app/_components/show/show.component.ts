import { Component, ViewChild } from "@angular/core";
import * as dialogs from "tns-core-modules/ui/dialogs";
import { Router } from "@angular/router";
import { ListViewEventData, ListViewGridLayout, ListViewLinearLayout } from "nativescript-ui-listview";
import { RadListViewComponent } from "nativescript-ui-listview/angular";
import { ConnectionService } from "../../_services/connection.service";

@Component({
    selector: "app-show",
    templateUrl: "./show.component.html",
    styleUrls: ["./show.component.scss"],
})
export class ShowComponent {
    public slides: any[] = [];
    public gridLayout = false;
    @ViewChild("listview") private listview: RadListViewComponent;
    constructor(private connectionService: ConnectionService, private router: Router) { }

    public ngOnInit(): void {
        this.connectionService.get("slides").subscribe((data) => {
            if (data && data.slides) {
                this.slides = data.slides;
                if (this.slides.length == 0) {
                    this.noShowLoaded();
                }
            }
        }, (error) => {
            if (error && error.error && error.error.error) {
                if (error.error.noShowLoaded) {
                    this.noShowLoaded();
                } else {
                    dialogs.alert(error.error.error);
                    this.router.navigate(["/home"]);
                }
            } else {
                dialogs.alert("Unknown error occured");
            }
        });
    }

    public showSlide(slide: Record<string, string>): void {
        this.connectionService.post("show", { slideId: slide.id }).subscribe();
    }

    public refreshSlides(args: ListViewEventData) {
        this.connectionService.get("slides").subscribe((data) => {
            if (data && data.slides) {
                this.slides = data.slides;
                const listView = args.object;
                listView.notifyPullToRefreshFinished();
                this.listview.nativeElement.refresh();
            }
        }, () => undefined);
    }

    public layoutChanged(layout: "grid" | "list"): void {
        this.gridLayout = layout == "grid";
        this.listview.setLayout(layout == "grid" ? new ListViewGridLayout() : new ListViewLinearLayout());
    }

    public getSlideThumbnailImageSource(slide: Record<string, string>): string {
        return `${this.connectionService.apiUrl}thumbnails/${slide.id}`;
    }

    private noShowLoaded() {
        dialogs.confirm({
            title: "No show loaded",
            message: "Do you want to open a recent show?",
            okButtonText: "Yes",
            cancelButtonText: "No",
            neutralButtonText: "",
        }).then((v) => {
            if (v) {
                this.connectionService.get("recentShows").subscribe((shows) => {
                    dialogs.action({
                        title: "Open recent show",
                        message: "Select a show file to open it",
                        actions: shows,
                    }).then((show) => {
                        this.connectionService.post("openRecentShow", { show }).subscribe((d) => {
                            if (d && d.success) {
                                dialogs.alert("Show loaded successfully!");
                                this.ngOnInit();
                            } else {
                                dialogs.alert("Unknown error occurred");
                            }
                        }, (e) => {
                            dialogs.alert(e);
                        });
                    });
                });
            }
        });
    }
}
