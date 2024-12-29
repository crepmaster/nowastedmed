import { Observable } from '@nativescript/core';
import { 
    ExchangeNotification,
    NotificationType,
    NotificationPreferences 
} from '../../models/exchange/exchange-notification.model';

export class NotificationService extends Observable {
    private static instance: NotificationService;
    private notifications: ExchangeNotification[] = [];
    private preferences: Map<string, NotificationPreferences> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    async createNotification(
        exchangeId: string,
        type: NotificationType,
        recipientId: string,
        message: string
    ): Promise<ExchangeNotification> {
        const notification: ExchangeNotification = {
            id: Date.now().toString(),
            exchangeId,
            type,
            recipientId,
            message,
            createdAt: new Date(),
            read: false
        };

        this.notifications.push(notification);
        await this.sendNotification(notification);
        return notification;
    }

    async getNotifications(userId: string): Promise<ExchangeNotification[]> {
        return this.notifications.filter(n => n.recipientId === userId);
    }

    async markAsRead(notificationId: string): Promise<void> {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
        }
    }

    private async sendNotification(notification: ExchangeNotification): Promise<void> {
        const preferences = this.preferences.get(notification.recipientId);
        if (!preferences) return;

        if (preferences.emailNotifications) {
            // Send email notification (mock)
            console.log('Sending email notification:', notification);
        }

        if (preferences.pushNotifications) {
            // Send push notification (mock)
            console.log('Sending push notification:', notification);
        }
    }
}