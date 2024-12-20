import { Frame, NavigationEntry, Page } from '@nativescript/core';

export class NavigationService {
    private static instance: NavigationService;
    private mainFrame: Frame | null = null;

    private constructor() {}

    static getInstance(): NavigationService {
        if (!NavigationService.instance) {
            NavigationService.instance = new NavigationService();
        }
        return NavigationService.instance;
    }

    setMainFrame(frame: Frame): void {
        this.mainFrame = frame;
    }

    navigate(options: NavigationEntry): void {
        try {
            if (!this.mainFrame) {
                const frame = Frame.topmost();
                if (!frame) {
                    console.error('No frame available for navigation');
                    return;
                }
                this.mainFrame = frame;
            }
            this.mainFrame.navigate(options);
        } catch (error) {
            console.error('Navigation error:', error);
        }
    }

    goBack(): void {
        try {
            if (this.mainFrame) {
                this.mainFrame.goBack();
            } else {
                const frame = Frame.topmost();
                if (frame) {
                    frame.goBack();
                }
            }
        } catch (error) {
            console.error('Navigation back error:', error);
        }
    }
}