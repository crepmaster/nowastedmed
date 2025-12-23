import { NavigatedData, Page, Frame } from '@nativescript/core';
import { SubscriptionViewModel } from './subscription-view-model';

export function onNavigatingTo(args: NavigatedData): void {
    const page = <Page>args.object;
    page.bindingContext = new SubscriptionViewModel();
}

export function goBack(): void {
    Frame.topmost().goBack();
}
