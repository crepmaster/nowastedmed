import { NavigatedData, Page } from '@nativescript/core';
import { PharmacyFormViewModel } from './pharmacy-form-view-model';
import { NavigationService } from '../../../services/navigation.service';

export function onNavigatingTo(args: NavigatedData) {
    const page = <Page>args.object;
    const context = page.navigationContext || { mode: 'create' };
    page.bindingContext = new PharmacyFormViewModel(context);
}

export function onBackTap() {
    NavigationService.getInstance().navigate({
        moduleName: 'pages/admin/dashboard/admin-dashboard-page',
        clearHistory: true
    });
}