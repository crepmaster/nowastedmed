import { NavigationService } from './services/navigation.service';
import { Frame } from '@nativescript/core';

export function onLoaded(args) {
    console.log('APP-ROOT: Frame loaded');
    const frame = args.object as Frame;
    console.log('APP-ROOT: Setting main frame');
    NavigationService.getInstance().setMainFrame(frame);
    console.log('APP-ROOT: Main frame set');

    // Force navigation if no current page
    if (!frame.currentPage) {
        console.log('APP-ROOT: No current page, navigating to login');
        frame.navigate({
            moduleName: 'pages/login/login-page',
            clearHistory: true
        });
    }
}