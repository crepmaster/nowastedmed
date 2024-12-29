import { NavigatedData, Page } from '@nativescript/core';
import { ExchangeDetailsViewModel } from './exchange-details-view-model';

export function onNavigatingTo(args: NavigatedData) {
    const page = <Page>args.object;
    const exchangeId = page.navigationContext.exchangeId;
    page.bindingContext = new ExchangeDetailsViewModel(exchangeId);
}

export function onBackTap() {
    const frame = require("@nativescript/core").Frame;
    frame.topmost().goBack();
}