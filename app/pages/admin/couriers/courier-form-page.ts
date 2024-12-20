import { NavigatedData, Page } from '@nativescript/core';
import { CourierFormViewModel } from './courier-form-view-model';
import { NavigationService } from '../../../services/navigation.service';

export function onNavigatingTo(args: NavigatedData) {
    const page = <Page>args.object;
    const context = page.navigationContext || { mode: 'create' };
    page.bindingContext = new CourierFormViewModel(context);
}

export function onBackTap() {
    NavigationService.getInstance().navigate({
        moduleName: 'pages/admin/dashboard/admin-dashboard-page',
        clearHistory: true
    });
}