import { NavigatedData, Page } from '@nativescript/core';
import { LoginViewModel } from './login-view-model';

export function onNavigatingTo(args: NavigatedData) {
    console.log('LOGIN PAGE: onNavigatingTo called');
    const page = <Page>args.object;
    if (!page.bindingContext) {
        console.log('LOGIN PAGE: Creating LoginViewModel');
        page.bindingContext = new LoginViewModel();
    }
    console.log('LOGIN PAGE: Setup complete');
}