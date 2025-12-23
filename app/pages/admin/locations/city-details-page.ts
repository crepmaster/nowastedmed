import { NavigatedData, Page } from '@nativescript/core';
import { CityDetailsViewModel } from './city-details-view-model';

export function onNavigatingTo(args: NavigatedData) {
    const page = <Page>args.object;
    const context = page.navigationContext;
    page.bindingContext = new CityDetailsViewModel(context?.cityId);
}

export function onBackTap(args: any) {
    const page = args.object.page;
    page.frame.goBack();
}
