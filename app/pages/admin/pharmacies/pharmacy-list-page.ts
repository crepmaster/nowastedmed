import { NavigatedData, Page, Frame } from '@nativescript/core';
import { PharmacyListViewModel } from './pharmacy-list-view-model';

export function onNavigatingTo(args: NavigatedData) {
    const page = <Page>args.object;
    if (!page.bindingContext) {
        page.bindingContext = new PharmacyListViewModel();
    }
}

export function onBackTap() {
    Frame.topmost().goBack();
}