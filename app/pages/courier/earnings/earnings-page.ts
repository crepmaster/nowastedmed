import { NavigatedData, Page } from '@nativescript/core';
import { EarningsViewModel } from './earnings-view-model';

export function onNavigatingTo(args: NavigatedData) {
    const page = <Page>args.object;
    page.bindingContext = new EarningsViewModel();
}
