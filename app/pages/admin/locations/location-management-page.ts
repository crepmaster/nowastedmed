import { NavigatedData, Page } from '@nativescript/core';
import { LocationManagementViewModel } from './location-management-view-model';

export function onNavigatingTo(args: NavigatedData) {
    const page = <Page>args.object;
    page.bindingContext = new LocationManagementViewModel();
}

export function onBackTap(args: any) {
    const page = args.object.page;
    page.frame.goBack();
}
