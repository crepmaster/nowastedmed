import { NavigatedData, Page } from '@nativescript/core';
import { ExchangeProposalViewModel } from './exchange-proposal-view-model';

export function onNavigatingTo(args: NavigatedData) {
    const page = <Page>args.object;
    const availableMedicine = page.navigationContext?.availableMedicine;
    const exchangeId = page.navigationContext?.exchangeId;

    if (!availableMedicine || !exchangeId) {
        console.error('Missing required navigation context');
        return;
    }

    page.bindingContext = new ExchangeProposalViewModel(availableMedicine, exchangeId);
}

export function onBackTap() {
    const frame = require("@nativescript/core").Frame;
    frame.topmost().goBack();
}
