import { NavigatedData, Page } from '@nativescript/core';
import { CourierListViewModel } from './courier-list-view-model';

export function onNavigatingTo(args: NavigatedData) {
    const page = <Page>args.object;
    if (!page.bindingContext) {
        page.bindingContext = new CourierListViewModel();
    }
}

export function onBackTap() {
    const frame = require("@nativescript/core").Frame;
    frame.topmost().goBack();
}