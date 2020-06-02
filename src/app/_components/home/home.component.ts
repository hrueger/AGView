import {
    Component, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef, ElementRef,
} from "@angular/core";
import { remote } from "electron";
import { SplitComponent } from "angular-split";
import * as path from "path";
import { v4 as uuid } from "uuid";
import { PreviewComponent } from "../preview/preview.component";
import { SettingsService } from "../../_services/settings.service";
import { ShowService } from "../../_services/show.service";
import { ThumbnailService } from "../../_services/thumbnail.service";
import { Slide } from "../../_classes/slide";
import { supportedFilesFilters, supportedFiles } from "../../_globals/supportedFilesFilters";

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
    @ViewChild("nameInput") public nameInput: ElementRef;
    public activeDrag = false;
    public thumbnailSize = 5;
    public currentSlideIdx: number;
    public viewingGlobalSettings = false;


    constructor(
        private settingsService: SettingsService,
        private showService: ShowService,
        private thumbnailService: ThumbnailService,
        private cdr: ChangeDetectorRef,
    ) {
        this.mainSplitSize = this.settingsService.store.get("mainSplitSize");
        this.previewSplitSize = this.settingsService.store.get("previewSplitSize");
    }

    public selectSlide(event, idx) {
        this.currentSlideIdx = idx;
        this.detectChanges();
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        setTimeout(() => {
            this.detectChanges();
        }, 50);
        remote.ipcMain.emit("transition-to", this.slides[idx]);
        this.showService.slideIdxChanged.next(
            { idx: this.currentSlideIdx, length: this.slides.length },
        );
    }

    public deselectSlide() {
        this.currentSlideIdx = undefined;
        this.showService.slideIdxChanged.next(
            { idx: this.currentSlideIdx, length: this.slides.length },
        );
        this.detectChanges();
    }

    public ngOnInit() {
        this.showService.messages.subscribe((message) => {
            switch (message) {
            case "importSlides":
                this.importSlides();
                break;
            case "renameSlide":
                if (this.currentSlideIdx === undefined) {
                    break;
                }
                this.viewingGlobalSettings = false;
                this.cdr.detectChanges();
                setTimeout(() => {
                    this.nameInput.nativeElement.focus();
                });
                break;
            case "slideProperties":
                if (this.currentSlideIdx === undefined) {
                    break;
                }
                this.viewingGlobalSettings = false;
                this.cdr.detectChanges();
                break;
            case "removeSlide":
                if (this.currentSlideIdx === undefined) {
                    break;
                }
                this.slides = this.slides.filter((s, idx) => idx != this.currentSlideIdx);
                this.currentSlideIdx = undefined;
                this.cdr.detectChanges();
                break;
            case "viewFirstSlide":
                this.selectSlide(null, 0);
                break;
            case "viewLastSlide":
                this.selectSlide(null, this.slides.length - 1);
                break;
            case "viewNextSlide":
                if (this.currentSlideIdx === undefined
                || this.currentSlideIdx + 1 >= this.slides.length) {
                    break;
                }
                this.selectSlide(null, this.currentSlideIdx + 1);
                break;
            case "viewPreviousSlide":
                if (this.currentSlideIdx === undefined || this.currentSlideIdx < 1) {
                    break;
                }
                this.selectSlide(null, this.currentSlideIdx - 1);
                break;
            default:
                break;
            }
        });

        remote.ipcMain.emit("obs-action", "initialize");
        this.showService.data.subscribe((data) => {
            if (data && data.slides) {
                this.slides = data.slides;
                this.ensureThumbnails();
                remote.ipcMain.emit("add-slides", this.slides);
            } else {
                this.slides = [];
            }
            this.detectChanges();
            this.showService.slideIdxChanged.next(
                { idx: this.currentSlideIdx, length: this.slides.length },
            );
        });
    }
    public detectChanges(propertiesChanged = false) {
        this.cdr.detectChanges();
        if (propertiesChanged && this.currentSlideIdx != undefined
            && this.slides[this.currentSlideIdx]) {
            remote.ipcMain.emit("update-properties", this.slides[this.currentSlideIdx]);
        }
    }
    public ngAfterViewInit(): void {
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

    public onDragOver() {
        this.activeDrag = true;
        return false;
    }
    public onDragLeave() {
        this.activeDrag = false;
        return false;
    }
    public onDrop(e) {
        this.activeDrag = false;
        const files = [];
        for (const f of e.dataTransfer.files) {
            files.push(f.path);
        }
        this.addSlides(files);
        e.preventDefault();
        return false;
    }

    private storeSplitSizes() {
        this.settingsService.store.set("mainSplitSize", this.mainSplit.displayedAreas[1].size);
        this.settingsService.store.set("previewSplitSize", this.rightSplit.displayedAreas[1].size);
    }

    public importSlides() {
        const files = remote.dialog.showOpenDialogSync({
            title: "Import slides",
            filters: supportedFilesFilters,
            defaultPath: this.settingsService.store.get("importSlideDefaultPath"),
        });
        if (!files || files.length == 0) {
            return;
        }
        this.settingsService.store.set("importSlideDefaultPath", path.dirname(files[0]));
        this.addSlides(files);
    }

    private addSlides(files: string[]) {
        for (const slide of files) {
            const ext = path.extname(slide).replace(".", "");
            const types = supportedFiles.filter((f) => f.extensions.includes(ext));
            if (!(types && types[0])) {
                // eslint-disable-next-line no-continue
                continue;
            }
            const s = new Slide();
            s.type = types[0].slideType;
            s.id = uuid();
            s.filePath = path.normalize(slide);
            [s.name] = path.basename(slide).split(".");
            this.slides.push(s);
        }
        this.ensureThumbnails();
        this.saveSlides();
        remote.ipcMain.emit("add-slides", this.slides);
        this.showService.slideIdxChanged.next(
            { idx: this.currentSlideIdx, length: this.slides.length },
        );
    }

    private saveSlides() {
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
