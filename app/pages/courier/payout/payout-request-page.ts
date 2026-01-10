import { NavigatedData, Page, Frame } from '@nativescript/core';
import { PayoutRequestViewModel } from './payout-request-view-model';

export function onNavigatingTo(args: NavigatedData): void {
    const page = <Page>args.object;
    if (!page.bindingContext) {
        page.bindingContext = new PayoutRequestViewModel();
    }
}

export function goBack(): void {
    const frame = Frame.topmost();
    if (frame && frame.canGoBack()) {
        frame.goBack();
    }
}
