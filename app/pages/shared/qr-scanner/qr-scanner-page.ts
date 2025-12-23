import { NavigatedData, Page } from '@nativescript/core';
import { QRScannerViewModel } from './qr-scanner-view-model';

export function onNavigatingTo(args: NavigatedData) {
    const page = <Page>args.object;
    page.bindingContext = new QRScannerViewModel();
}

export function onBackTap() {
    const frame = require("@nativescript/core").Frame;
    frame.topmost().goBack();
}
