import { NavigatedData, Page } from '@nativescript/core';
import { AdminDashboardViewModel } from './admin-dashboard-view-model';

export function onNavigatingTo(args: NavigatedData) {
    const page = <Page>args.object;
    if (!page.bindingContext) {
        page.bindingContext = new AdminDashboardViewModel();
    }
}