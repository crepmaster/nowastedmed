/**
 * Audit Firebase Service
 *
 * Provides audit logging for financial transactions and security-sensitive operations.
 * All audit logs are immutable - no updates or deletes allowed.
 */

import { firebase } from '@nativescript/firebase-core';
import '@nativescript/firebase-firestore'; // Augments firebase() with firestore()
import { AuthFirebaseService } from './auth-firebase.service';

/**
 * Types of auditable events
 */
export type AuditEventType =
    // Financial transactions
    | 'payout_requested'
    | 'payout_completed'
    | 'payout_failed'
    | 'earning_created'
    | 'earning_available'
    | 'earning_paid'
    | 'payment_received'
    | 'payment_refunded'
    | 'wallet_created'
    | 'wallet_balance_updated'
    // Delivery events
    | 'delivery_accepted'
    | 'delivery_pickup_confirmed'
    | 'delivery_completed'
    | 'delivery_cancelled'
    // Security events
    | 'auth_failed'
    | 'unauthorized_access_attempt'
    | 'suspicious_activity';

/**
 * Audit log entry
 */
export interface AuditLog {
    id?: string;
    eventType: AuditEventType;
    userId: string;
    userRole?: string;
    targetId?: string;          // ID of the affected resource (delivery, payout, etc.)
    targetType?: string;        // Type of resource (delivery, payout, earning, etc.)
    action: string;             // Human-readable action description
    details?: Record<string, any>; // Additional details
    amount?: number;            // For financial transactions
    currency?: string;          // For financial transactions
    previousValue?: any;        // Previous state (for updates)
    newValue?: any;             // New state (for updates)
    ipAddress?: string;         // If available
    userAgent?: string;         // If available
    timestamp: Date;
    success: boolean;
    errorMessage?: string;
}

export class AuditFirebaseService {
    private static instance: AuditFirebaseService;
    private firestore: any;
    private authService: AuthFirebaseService;
    private readonly AUDIT_COLLECTION = 'audit_logs';

    private constructor() {
        this.firestore = firebase().firestore();
        this.authService = AuthFirebaseService.getInstance();
    }

    static getInstance(): AuditFirebaseService {
        if (!AuditFirebaseService.instance) {
            AuditFirebaseService.instance = new AuditFirebaseService();
        }
        return AuditFirebaseService.instance;
    }

    /**
     * Log a financial transaction
     */
    async logFinancialTransaction(
        eventType: AuditEventType,
        targetId: string,
        targetType: string,
        action: string,
        amount: number,
        currency: string,
        details?: Record<string, any>,
        success: boolean = true,
        errorMessage?: string
    ): Promise<string> {
        const currentUser = this.authService.getCurrentUser();

        const auditLog: Omit<AuditLog, 'id'> = {
            eventType,
            userId: currentUser?.id || 'system',
            targetId,
            targetType,
            action,
            amount,
            currency,
            details,
            timestamp: new Date(),
            success,
            errorMessage,
        };

        return this.createAuditLog(auditLog);
    }

    /**
     * Log a delivery event
     */
    async logDeliveryEvent(
        eventType: AuditEventType,
        deliveryId: string,
        action: string,
        details?: Record<string, any>,
        success: boolean = true,
        errorMessage?: string
    ): Promise<string> {
        const currentUser = this.authService.getCurrentUser();

        const auditLog: Omit<AuditLog, 'id'> = {
            eventType,
            userId: currentUser?.id || 'system',
            targetId: deliveryId,
            targetType: 'delivery',
            action,
            details,
            timestamp: new Date(),
            success,
            errorMessage,
        };

        return this.createAuditLog(auditLog);
    }

    /**
     * Log a security event
     */
    async logSecurityEvent(
        eventType: AuditEventType,
        action: string,
        details?: Record<string, any>,
        targetId?: string,
        targetType?: string
    ): Promise<string> {
        const currentUser = this.authService.getCurrentUser();

        const auditLog: Omit<AuditLog, 'id'> = {
            eventType,
            userId: currentUser?.id || 'anonymous',
            targetId,
            targetType,
            action,
            details,
            timestamp: new Date(),
            success: false, // Security events are typically failures
        };

        return this.createAuditLog(auditLog);
    }

    /**
     * Log a payout request
     */
    async logPayoutRequested(
        payoutId: string,
        courierId: string,
        amount: number,
        currency: string,
        paymentMethod: string,
        paymentAccount: string
    ): Promise<string> {
        return this.logFinancialTransaction(
            'payout_requested',
            payoutId,
            'payout',
            `Payout request of ${amount} ${currency} via ${paymentMethod}`,
            amount,
            currency,
            {
                courierId,
                paymentMethod,
                // Mask payment account for security
                paymentAccount: this.maskAccount(paymentAccount),
            }
        );
    }

    /**
     * Log a payout completion
     */
    async logPayoutCompleted(
        payoutId: string,
        courierId: string,
        amount: number,
        currency: string,
        transactionId: string,
        adminId: string
    ): Promise<string> {
        return this.logFinancialTransaction(
            'payout_completed',
            payoutId,
            'payout',
            `Payout of ${amount} ${currency} completed`,
            amount,
            currency,
            {
                courierId,
                transactionId,
                processedBy: adminId,
            }
        );
    }

    /**
     * Log a payout failure
     */
    async logPayoutFailed(
        payoutId: string,
        courierId: string,
        amount: number,
        currency: string,
        reason: string,
        adminId: string
    ): Promise<string> {
        return this.logFinancialTransaction(
            'payout_failed',
            payoutId,
            'payout',
            `Payout of ${amount} ${currency} failed: ${reason}`,
            amount,
            currency,
            {
                courierId,
                reason,
                processedBy: adminId,
            },
            false,
            reason
        );
    }

    /**
     * Log an earning creation
     */
    async logEarningCreated(
        earningId: string,
        courierId: string,
        deliveryId: string,
        amount: number,
        netAmount: number,
        currency: string
    ): Promise<string> {
        return this.logFinancialTransaction(
            'earning_created',
            earningId,
            'earning',
            `Earning of ${netAmount} ${currency} created for delivery ${deliveryId}`,
            netAmount,
            currency,
            {
                courierId,
                deliveryId,
                grossAmount: amount,
                netAmount,
            }
        );
    }

    /**
     * Log a payment received from pharmacy
     */
    async logPaymentReceived(
        deliveryId: string,
        pharmacyId: string,
        amount: number,
        currency: string,
        paymentMethod: string
    ): Promise<string> {
        return this.logFinancialTransaction(
            'payment_received',
            deliveryId,
            'delivery_payment',
            `Payment of ${amount} ${currency} received from pharmacy`,
            amount,
            currency,
            {
                pharmacyId,
                paymentMethod,
            }
        );
    }

    /**
     * Log a payment refund
     */
    async logPaymentRefunded(
        deliveryId: string,
        pharmacyId: string,
        amount: number,
        currency: string,
        reason: string
    ): Promise<string> {
        return this.logFinancialTransaction(
            'payment_refunded',
            deliveryId,
            'delivery_payment',
            `Payment of ${amount} ${currency} refunded to pharmacy`,
            amount,
            currency,
            {
                pharmacyId,
                reason,
            }
        );
    }

    /**
     * Log unauthorized access attempt
     */
    async logUnauthorizedAccess(
        action: string,
        resourceType: string,
        resourceId?: string,
        details?: Record<string, any>
    ): Promise<string> {
        return this.logSecurityEvent(
            'unauthorized_access_attempt',
            `Unauthorized attempt to ${action}`,
            {
                ...details,
                resourceType,
            },
            resourceId,
            resourceType
        );
    }

    /**
     * Create an audit log entry
     */
    private async createAuditLog(log: Omit<AuditLog, 'id'>): Promise<string> {
        try {
            const docRef = await this.firestore
                .collection(this.AUDIT_COLLECTION)
                .add(log);

            return docRef.id;
        } catch (error) {
            // Audit logging should never throw - log to console and continue
            console.error('Error creating audit log:', error);
            console.log('Audit log (fallback):', JSON.stringify(log));
            return '';
        }
    }

    /**
     * Mask a payment account for logging
     */
    private maskAccount(account: string): string {
        if (!account || account.length < 4) {
            return '****';
        }
        const visible = account.slice(-4);
        const masked = '*'.repeat(Math.max(0, account.length - 4));
        return masked + visible;
    }

    /**
     * Get audit logs for a specific user
     */
    async getUserAuditLogs(userId: string, limit: number = 50): Promise<AuditLog[]> {
        try {
            const snapshot = await this.firestore
                .collection(this.AUDIT_COLLECTION)
                .where('userId', '==', userId)
                .orderBy('timestamp', 'desc')
                .limit(limit)
                .get();

            return snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp,
            }));
        } catch (error) {
            console.error('Error getting user audit logs:', error);
            return [];
        }
    }

    /**
     * Get audit logs for a specific resource
     */
    async getResourceAuditLogs(
        targetId: string,
        targetType: string,
        limit: number = 50
    ): Promise<AuditLog[]> {
        try {
            const snapshot = await this.firestore
                .collection(this.AUDIT_COLLECTION)
                .where('targetId', '==', targetId)
                .where('targetType', '==', targetType)
                .orderBy('timestamp', 'desc')
                .limit(limit)
                .get();

            return snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp,
            }));
        } catch (error) {
            console.error('Error getting resource audit logs:', error);
            return [];
        }
    }

    /**
     * Get financial audit logs for reporting
     */
    async getFinancialAuditLogs(
        startDate: Date,
        endDate: Date,
        eventTypes?: AuditEventType[],
        limit: number = 500
    ): Promise<AuditLog[]> {
        try {
            let query = this.firestore
                .collection(this.AUDIT_COLLECTION)
                .where('timestamp', '>=', startDate)
                .where('timestamp', '<=', endDate);

            if (eventTypes && eventTypes.length > 0) {
                query = query.where('eventType', 'in', eventTypes);
            }

            const snapshot = await query
                .orderBy('timestamp', 'desc')
                .limit(limit)
                .get();

            return snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp,
            }));
        } catch (error) {
            console.error('Error getting financial audit logs:', error);
            return [];
        }
    }
}
