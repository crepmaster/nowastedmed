import { NavigatedData, Page } from '@nativescript/core';
import { CreateExchangeViewModel } from './create-exchange-view-model';

export function onNavigatingTo(args: NavigatedData) {
    const page = <Page>args.object;
    const medicine = page.navigationContext?.medicine;
    if (!medicine) {
        console.error('No medicine provided in navigation context');
        return;
    }
    page.bindingContext = new CreateExchangeViewModel(medicine);
}

export function onBackTap() {
    const frame = require("@nativescript/core").Frame;
    frame.topmost().goBack();
}