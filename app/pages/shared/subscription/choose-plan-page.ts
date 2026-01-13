import { NavigatedData, Page, EventData } from '@nativescript/core';
import { ChoosePlanViewModel } from './choose-plan-view-model';

export function onNavigatingTo(args: NavigatedData): void {
    const page = <Page>args.object;
    if (!page.bindingContext) {
        page.bindingContext = new ChoosePlanViewModel();
    }
}

export function onPlanTap(args: EventData): void {
    const button = args.object as any;
    const page = button.page;
    const viewModel = page.bindingContext as ChoosePlanViewModel;
    viewModel.onSelectPlan(args);
}
