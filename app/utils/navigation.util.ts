import { Frame, NavigationEntry } from '@nativescript/core';

export class NavigationUtil {
    private static instance: NavigationUtil;

    private constructor() {}

    static getInstance(): NavigationUtil {
        if (!NavigationUtil.instance) {
            NavigationUtil.instance = new NavigationUtil();
        }
        return NavigationUtil.instance;
    }

    navigate(options: NavigationEntry): void {
        try {
            const frame = Frame.topmost();
            if (!frame) {
                console.error('No frame available');
                return;
            }
            frame.navigate(options);
        } catch (error) {
            console.error('Navigation error:', error);
        }
    }

    goBack(): void {
        try {
            const frame = Frame.topmost();
            if (frame) {
                frame.goBack();
            }
        } catch (error) {
            console.error('Navigation back error:', error);
        }
    }
}