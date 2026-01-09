import { NavigatedData, Page, Frame } from '@nativescript/core';
import { WalletViewModel } from './wallet-view-model';

export function onNavigatingTo(args: NavigatedData): void {
    const page = <Page>args.object;
    if (!page.bindingContext) {
        page.bindingContext = new WalletViewModel();
    }
}

export function goBack(): void {
    console.log('WALLET: goBack called');
    const frame = Frame.topmost();
    if (frame && frame.canGoBack()) {
        frame.goBack();
    } else {
        // Fallback to dashboard if no back stack
        frame.navigate({
            moduleName: 'pages/pharmacy/dashboard/pharmacy-dashboard-page',
            clearHistory: true
        });
    }
}
