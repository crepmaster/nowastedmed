import { NavigatedData, Page, Frame } from '@nativescript/core';
import { RegistrationViewModel } from './registration-view-model';

export function onNavigatingTo(args: NavigatedData) {
    console.log('Registration page navigating to...');
    const page = <Page>args.object;
    if (!page.bindingContext) {
        page.bindingContext = new RegistrationViewModel();
    }
}

export function onBackTap() {
    console.log('Going back to login...');
    Frame.topmost().goBack();
}