export type NotificationType = 'proposal' | 'acceptance' | 'rejection' | 'completion';

export interface ExchangeNotification {
  id: string;
  exchangeId: string;
  type: NotificationType;
  recipientId: string;
  message: string;
  createdAt: Date;
  read: boolean;
}

export interface NotificationPreferences {
  pharmacyId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  notificationTypes: NotificationType[];
}