import { NavigatedData, Page, Frame } from '@nativescript/core';
import { EditProfileViewModel } from './edit-profile-view-model';

export function onNavigatingTo(args: NavigatedData): void {
    const page = <Page>args.object;
    if (!page.bindingContext) {
        page.bindingContext = new EditProfileViewModel();
    }
}

export function goBack(): void {
    const frame = Frame.topmost();
    if (frame && frame.canGoBack()) {
        frame.goBack();
    }
}
