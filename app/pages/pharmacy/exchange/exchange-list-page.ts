import { NavigatedData, Page } from '@nativescript/core';
import { ExchangeListViewModel } from './exchange-list-view-model';

export function onNavigatingTo(args: NavigatedData) {
    const page = <Page>args.object;
    if (!page.bindingContext) {
        page.bindingContext = new ExchangeListViewModel();
    }
}

export function onBackTap() {
    const frame = require("@nativescript/core").Frame;
    frame.topmost().goBack();
}