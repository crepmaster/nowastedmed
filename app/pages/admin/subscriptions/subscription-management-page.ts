import { NavigatedData, Page } from '@nativescript/core';
import { SubscriptionManagementViewModel } from './subscription-management-view-model';

export function onNavigatingTo(args: NavigatedData) {
    const page = <Page>args.object;
    page.bindingContext = new SubscriptionManagementViewModel();
}
