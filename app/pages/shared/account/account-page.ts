import { NavigatedData, Page, Frame } from '@nativescript/core';
import { AccountViewModel } from './account-view-model';

export function onNavigatingTo(args: NavigatedData): void {
    const page = <Page>args.object;
    if (!page.bindingContext) {
        page.bindingContext = new AccountViewModel();
    } else {
        // Refresh data when returning to this page (e.g., from edit profile)
        (page.bindingContext as AccountViewModel).refresh();
    }
}

export function goBack(): void {
    const frame = Frame.topmost();
    if (frame && frame.canGoBack()) {
        frame.goBack();
    }
}
