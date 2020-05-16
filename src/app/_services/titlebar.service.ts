import { Injectable } from "@angular/core";
import * as customTitlebar from "custom-electron-titlebar";
import { remote, shell, app } from "electron";
import { ShowService } from "./show.service";

@Injectable({
    providedIn: "root"
})
export class TitlebarService {
    titlebar: customTitlebar.Titlebar;
    constructor(
        private showService: ShowService,
    ) {
        const isMac = process.platform === "darwin"
        const menuTemplate: any[] = [
            {
                label: "File",
                submenu: [
                    {
                        label: "New file",
                        accelerator: "Ctrl+N",
                        click: () => this.showService.new(),
                    },
                    {
                        type: "separator"
                    },
                    {
                        label: "Open file",
                        accelerator: "Ctrl+O",
                        click: () => this.showService.open(),
                    },
                    {
                        label: "Open recent",
                        submenu: [
                            {
                                label: "1"
                            },
                            {
                                label: "1"
                            },
                        ]
                    },
                    {
                        type: "separator"
                    },
                    {
                        label: "Save",
                        accelerator: "Ctrl+S",
                        click: () => this.showService.save(),
                    },
                    {
                        label: "Save as...",
                        accelerator: "Ctrl+Shift+S",
                        click: () => this.showService.saveAs(),
                    },
                    {
                        type: "separator",
                    },
                    {
                        label: "Quit",
                        accelerator: "Ctrl+Q",
                        click: () => remote.app.quit(),
                    },
                ]
            },
            {
                label: "Window",
                submenu: [
                    { role: "minimize" },
                    { role: "close" }
                ],
            },
            {
                role: "help",
                submenu: [
                    {
                        label: "Learn More",
                        click: async () => {
                            await shell.openExternal("https://github.com/hrueger/AGView");
                        }
                    },
                    {
                        label: "Found a bug?",
                        click: async () => {
                            await shell.openExternal("https://github.com/hrueger/AGView/issues/new");
                        }
                    },
                    {
                        type: "separator",
                    },
                    {
                        label: "About",
                        click: () => this.about(),
                    }
                ]
            }
        ];
        const menu = remote.Menu.buildFromTemplate(menuTemplate)
        this.titlebar = new customTitlebar.Titlebar({
            backgroundColor: customTitlebar.Color.fromHex("#444"),
            icon: "assets/icons/favicon.png",
            enableMnemonics: true,
            hideWhenClickingClose: true,
            itemBackgroundColor: customTitlebar.Color.fromHex("#094771"),
            menu,
        });
    }

    public setTitle(t: string) {
        this.titlebar.updateTitle(t);
    }

    private about() {
        //
    }
}
