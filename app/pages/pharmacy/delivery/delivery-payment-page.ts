import { NavigatedData, Page, Frame } from '@nativescript/core';
import { DeliveryPaymentViewModel } from './delivery-payment-view-model';

export function onNavigatingTo(args: NavigatedData): void {
    const page = <Page>args.object;
    const context = page.navigationContext;

    if (!page.bindingContext) {
        page.bindingContext = new DeliveryPaymentViewModel(context);
    }
}

export function goBack(): void {
    const frame = Frame.topmost();
    if (frame && frame.canGoBack()) {
        frame.goBack();
    }
}
