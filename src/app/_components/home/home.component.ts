import {
    Component, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef, ElementRef, NgZone,
} from "@angular/core";
import { ipcRenderer, remote } from "electron";
import { SplitComponent } from "angular-split";
import * as path from "path";
import { v4 as uuid } from "uuid";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import * as os from "os";
import { execSync } from "child_process";
import * as sudo from "sudo-prompt";
import { PreviewComponent } from "../preview/preview.component";
import { SettingsService } from "../../_services/settings.service";
import { ShowService } from "../../_services/show.service";
import { ThumbnailService } from "../../_services/thumbnail.service";
import { Slide } from "../../_classes/slide";
import { supportedFilesFilters, supportedFiles } from "../../_globals/supportedFilesFilters";
import { MobileService } from "../../_services/mobile.service";

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
    public currentView: "slideSettings" | "globalSettings" | "mobiles" = "slideSettings";

    public interfaces: { name: string; ip: string }[] = [];
    public currentInterfaceIndex: number;
    public readonly isWindows = process.platform === "win32";
    positionInterval: NodeJS.Timeout;
    private checkForFirewallRule() {
        let ruleExists = false;
        try {
            if (execSync("netsh advfirewall firewall show rule name=AGView").toString().trim().endsWith("OK.")) {
                ruleExists = true;
            }
        } catch {
            //
        }
        if (this.isWindows && !ruleExists) {
            remote.dialog.showMessageBox({
                message: "The Windows Firewall rule required to be able to have mobiles connect to AGView Desktop is missing. Do you want to add it now? Administrator rights are necessary.",
                title: "Windows Firewall Rule missing",
                defaultId: 5,
                cancelId: 7,
                buttons: ["Yes", "No"],
            }).then((val) => {
                if (val.response === 0) {
                    this.configWinFirewall();
                }
            });
        }
    }

    constructor(
        public mobileService: MobileService,
        private settingsService: SettingsService,
        private showService: ShowService,
        private thumbnailService: ThumbnailService,
        private cdr: ChangeDetectorRef,
        private modalService: NgbModal,
    ) {
        this.mainSplitSize = this.settingsService.store.get("mainSplitSize");
        this.previewSplitSize = this.settingsService.store.get("previewSplitSize");
        const ifaces = os.networkInterfaces();

        for (const ifname of Object.keys(ifaces)) {
            ifaces[ifname].forEach((iface) => {
                if (iface.family !== "IPv4" || iface.internal !== false) {
                    return;
                }
                this.interfaces.push({ name: ifname, ip: iface.address });
            });
        }
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
        this.mobileService.slideChanged.subscribe((idx) => {
            if (idx !== undefined && idx > -1) {
                this.selectSlide(undefined, idx);
            }
        });
        this.showService.messages.subscribe((message) => {
            switch (message) {
            case "importSlides":
                this.importSlides();
                break;
            case "renameSlide":
                if (this.currentSlideIdx === undefined) {
                    break;
                }
                this.currentView = "slideSettings";
                this.cdr.detectChanges();
                setTimeout(() => {
                    this.nameInput.nativeElement.focus();
                });
                break;
            case "slideProperties":
                if (this.currentSlideIdx === undefined) {
                    break;
                }
                this.currentView = "slideSettings";
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
        this.mobileService.init();
        this.checkForFirewallRule();

        this.positionInterval = setInterval(async () => {
            if (this.slides[this.currentSlideIdx]) {
                this.slides[this.currentSlideIdx].position = await ipcRenderer.invoke("getMediaPosition", this.slides[this.currentSlideIdx].id);
                this.cdr.detectChanges();
            }
        }, 50);
    }
    public detectChanges(propertiesChanged = false) {
        this.cdr.detectChanges();
        if (propertiesChanged && this.currentSlideIdx != undefined
            && this.slides[this.currentSlideIdx]) {
            remote.ipcMain.emit("update-properties", this.slides[this.currentSlideIdx]);
        }
    }

    public ngOnDestroy() {
        clearInterval(this.positionInterval);
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

    private async addSlides(files: string[]) {
        for (const slide of files) {
            const ext = path.extname(slide).replace(".", "");
            const types = supportedFiles.filter((f) => f.extensions.includes(ext.toLowerCase()));
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
            if (s.type == "video") {
                const length = await ipcRenderer.invoke("getVideoFileLength", s.filePath);
                s.length = length;
                console.log(length);
                s.paused = false;
            }
        }
        this.ensureThumbnails();
        this.saveSlides();
        remote.ipcMain.emit("add-slides", this.slides);
        this.showService.slideIdxChanged.next(
            { idx: this.currentSlideIdx, length: this.slides.length },
        );
    }

    public async togglePlayPause() {
        if (this.slides[this.currentSlideIdx].paused) {
            this.slides[this.currentSlideIdx].paused = !(await ipcRenderer.invoke("playSource", this.slides[this.currentSlideIdx].id));
        } else {
            this.slides[this.currentSlideIdx].paused = await ipcRenderer.invoke("pauseSource", this.slides[this.currentSlideIdx].id);
        }
    }

    public async seek(position: number) {
        await ipcRenderer.invoke("seek", this.slides[this.currentSlideIdx].id, position);
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

    public async configWinFirewall(): Promise<void> {
        if (!this.isWindows) {
            return;
        }
        const electronExe = remote.app.getPath("exe");
        sudo.exec(`netsh advfirewall firewall add rule name="AGView" dir=in action=allow program="${electronExe}" enable=yes`,
            {},
            (error) => {
                if (error) {
                    remote.dialog.showErrorBox("Error while configuring Windows Firewall", `The following error occured:\n\n${error}`);
                } else {
                    remote.dialog.showMessageBox({
                        message: "The Windows Firewall was configured successfully.",
                        title: "Windows Firewall configured successfully",
                        buttons: ["OK"],
                    });
                }
            });
    }
}
