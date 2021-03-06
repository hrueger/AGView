import { Component } from "@angular/core";
import { BarcodeScanner } from "nativescript-barcodescanner";
import * as dialogs from "tns-core-modules/ui/dialogs";
import { Router } from "@angular/router";
import { ConnectionService } from "../../_services/connection.service";

@Component({
    selector: "Home",
    templateUrl: "./home.component.html",
    styleUrls: ["./home.component.scss"],
})
export class HomeComponent {
    constructor(public connectionService: ConnectionService, private router: Router) { }
    public scan(): void {
        const barcodeScanner = new BarcodeScanner();
        barcodeScanner.scan({
            formats: "QR_CODE",
            message: " ",
            showFlipCameraButton: false,
            preferFrontCamera: false,
            showTorchButton: false,
            beepOnScan: false,
            fullScreen: true,
            torchOn: false,
            resultDisplayDuration: 0,
            openSettingsIfPermissionWasPreviouslyDenied: true,
            presentInRootViewController: true,
        }).then((result) => {
            if (result.text.startsWith("agview://")) {
                this.connect(result.text.replace("agview://", ""));
            }
        }, () => undefined);
    }

    public type(): void {
        dialogs.prompt({
            title: "Connect",
            message: "Type in the IP address",
            okButtonText: "Connect",
            defaultText: "192.168.178.100",
            inputType: dialogs.inputType.text,
        }).then((r) => this.connect(r.text));
    }

    private connect(ip: string): void {
        this.connectionService.connect(ip).then(() => undefined, () => {
            dialogs.alert("Something went wrong.");
        });
    }

    public goToShow(): void {
        this.router.navigate(["/show"]);
    }
}
