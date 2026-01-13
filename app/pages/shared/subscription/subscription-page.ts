import { NavigatedData, Page, Frame, EventData } from '@nativescript/core';
import { SubscriptionViewModel } from './subscription-view-model';

export function onNavigatingTo(args: NavigatedData): void {
    const page = <Page>args.object;
    if (!page.bindingContext) {
        page.bindingContext = new SubscriptionViewModel();
    }
}

export function goBack(): void {
    console.log('SUBSCRIPTION: goBack called');
    const frame = Frame.topmost();
    if (frame && frame.canGoBack()) {
        console.log('SUBSCRIPTION: Can go back, navigating back');
        frame.goBack();
    } else {
        console.log('SUBSCRIPTION: Cannot go back, navigating to dashboard');
        frame.navigate({
            moduleName: 'pages/pharmacy/dashboard/pharmacy-dashboard-page',
            clearHistory: true
        });
    }
}

export function onPlanTap(args: EventData): void {
    const button = args.object as any;
    const page = button.page;
    const viewModel = page.bindingContext as SubscriptionViewModel;
    viewModel.onSelectPlan(args);
}
