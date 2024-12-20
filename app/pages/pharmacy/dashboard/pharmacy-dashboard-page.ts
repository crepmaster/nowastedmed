import { NavigatedData, Page } from '@nativescript/core';
import { PharmacyDashboardViewModel } from './pharmacy-dashboard-view-model';

export function onNavigatingTo(args: NavigatedData) {
    const page = <Page>args.object;
    if (!page.bindingContext) {
        page.bindingContext = new PharmacyDashboardViewModel();
    }
}