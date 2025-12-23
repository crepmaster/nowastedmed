import { NavigatedData, Page, Frame } from '@nativescript/core';
import { WalletViewModel } from './wallet-view-model';

export function onNavigatingTo(args: NavigatedData): void {
    const page = <Page>args.object;
    page.bindingContext = new WalletViewModel();
}

export function goBack(): void {
    Frame.topmost().goBack();
}
