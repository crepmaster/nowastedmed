import { NavigatedData, Page } from '@nativescript/core';
import { DeliveryDetailsViewModel } from './delivery-details-view-model';

export function onNavigatingTo(args: NavigatedData) {
    const page = <Page>args.object;
    const deliveryId = page.navigationContext?.deliveryId;
    page.bindingContext = new DeliveryDetailsViewModel(deliveryId);
}
