import {
    Component, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef,
} from "@angular/core";
import { remote } from "electron";
import { SplitComponent } from "angular-split";
import * as path from "path";
import { PreviewComponent } from "../preview/preview.component";
import { SettingsService } from "../../_services/settings.service";
import { ShowService } from "../../_services/show.service";
import { ThumbnailService } from "../../_services/thumbnail.service";
import { Slide } from "../../_classes/slide";

@Component({
    selector: "app-home",
    templateUrl: "./home.component.html",
    styleUrls: ["./home.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
    public mainSplitSize: number;
    public previewSplitSize: number;
    public slides: Slide[] = [];
    @ViewChild("preview") private preview: PreviewComponent;
    @ViewChild("mainSplit") public mainSplit: SplitComponent;
    @ViewChild("rightSplit") public rightSplit: SplitComponent;


    constructor(
        private settingsService: SettingsService,
        private showService: ShowService,
        private thumbnailService: ThumbnailService,
        private cdr: ChangeDetectorRef,
    ) {
        this.mainSplitSize = this.settingsService.store.get("mainSplitSize");
        this.previewSplitSize = this.settingsService.store.get("previewSplitSize");
    }

    ngOnInit() {
        remote.ipcMain.emit("obs-action", "initialize", "test", "cool");
        this.showService.data.subscribe((data) => {
            if (data && data.slides) {
                this.slides = data.slides;
                this.ensureThumbnails();
            } else {
                this.slides = [];
            }
            this.cdr.detectChanges();
        });
    }
    ngAfterViewInit(): void {
        this.mainSplit.dragProgress$.subscribe(() => {
            this.storeSplitSizes();
            this.preview.onResized();
        });
        this.rightSplit.dragProgress$.subscribe(() => {
            this.storeSplitSizes();
            this.preview.onResized();
        });
        /* .on("performanceStatistics", (d) => {
          console.log(d);
        }) */
    }

    private storeSplitSizes() {
        this.settingsService.store.set("mainSplitSize", this.mainSplit.displayedAreas[1].size);
        this.settingsService.store.set("previewSplitSize", this.rightSplit.displayedAreas[1].size);
    }

    public addVideos() {
        const videos = remote.dialog.showOpenDialogSync({
            title: "Add video files",
            filters: [
                { name: "Movies", extensions: ["mkv", "avi", "mp4"] },
            ],
            defaultPath: this.settingsService.store.get("openVideosDefaultPath"),
        });
        if (!videos || videos.length == 0) {
            return;
        }
        this.settingsService.store.set("openVideosDefaultPath", path.dirname(videos[0]));
        for (const video of videos) {
            const s = new Slide();
            s.filePath = path.normalize(video);
            s.name = path.dirname(video);
            s.type = "video";
            this.slides.push(s);
        }
        this.ensureThumbnails();
        this.showService.setData("slides", this.slides);
    }

    private ensureThumbnails() {
        for (const s of this.slides) {
            this.thumbnailService.ensureThumbnail(s.filePath).then((t) => {
                s.thumbnail = t;
                this.cdr.detectChanges();
            });
        }
    }
}
