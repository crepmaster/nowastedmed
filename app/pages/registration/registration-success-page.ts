import { NavigatedData, Page } from '@nativescript/core';
import { RegistrationSuccessViewModel } from './registration-success-view-model';

export function onNavigatingTo(args: NavigatedData) {
    const page = <Page>args.object;
    if (!page.bindingContext) {
        page.bindingContext = new RegistrationSuccessViewModel();
    }
}