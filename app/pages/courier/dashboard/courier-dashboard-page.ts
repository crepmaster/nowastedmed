import { NavigatedData, Page } from '@nativescript/core';
import { CourierDashboardViewModel } from './courier-dashboard-view-model';

export function onNavigatingTo(args: NavigatedData) {
    const page = <Page>args.object;
    if (!page.bindingContext) {
        page.bindingContext = new CourierDashboardViewModel();
    }
}