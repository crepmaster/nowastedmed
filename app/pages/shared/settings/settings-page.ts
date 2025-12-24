import { NavigatedData, Page, Frame } from '@nativescript/core';
import { SettingsViewModel } from './settings-view-model';

export function onNavigatingTo(args: NavigatedData): void {
    const page = <Page>args.object;
    page.bindingContext = new SettingsViewModel();
}

export function goBack(): void {
    Frame.topmost().goBack();
}
