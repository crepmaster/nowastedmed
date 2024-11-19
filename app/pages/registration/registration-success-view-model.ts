import { Observable, Frame } from '@nativescript/core';

export class RegistrationSuccessViewModel extends Observable {
    onBackToLogin() {
        Frame.topmost().navigate({
            moduleName: 'pages/login/login-page',
            clearHistory: true,
            transition: {
                name: 'fade',
                duration: 200
            }
        });
    }
}