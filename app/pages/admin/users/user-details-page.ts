import { NavigatedData, Page } from '@nativescript/core';
import { UserDetailsViewModel } from './user-details-view-model';

export function onNavigatingTo(args: NavigatedData) {
    const page = <Page>args.object;
    const userId = page.navigationContext.userId;
    page.bindingContext = new UserDetailsViewModel(userId);
}

export function onBackTap() {
    const frame = require("@nativescript/core").Frame;
    frame.topmost().goBack();
}