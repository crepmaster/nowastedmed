import { NavigatedData, Page } from '@nativescript/core';
import { CreateExchangeViewModel } from './create-exchange-view-model';

export function onNavigatingTo(args: NavigatedData) {
    const page = <Page>args.object;
    const medicine = page.navigationContext.medicine;
    page.bindingContext = new CreateExchangeViewModel(medicine);
}