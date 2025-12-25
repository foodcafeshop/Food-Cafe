import Razorpay from 'razorpay';
import crypto from 'crypto';
import { CreateSubscriptionParams, PaymentProvider } from './types';

export class RazorpayAdapter implements PaymentProvider {
    private instance: Razorpay;

    constructor() {
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            throw new Error('Razorpay credentials missing');
        }
        this.instance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
    }

    async createSubscription(params: CreateSubscriptionParams): Promise<string> {
        const options: any = {
            plan_id: params.planId,
            customer_notify: 1,
            total_count: params.totalCount || 120, // Default 10 years (effectively infinite)
            quantity: params.quantity || 1,
            notes: params.notes,
        };

        if (params.offerId) {
            options.offer_id = params.offerId;
        }

        if (params.startAt) {
            options.start_at = params.startAt;
        }

        if (params.expireBy) {
            options.expire_by = params.expireBy;
        }

        try {
            const subscription = await this.instance.subscriptions.create(options);
            return subscription.id;
        } catch (error: any) {
            console.error('Razorpay Create Subscription Error:', error);
            throw new Error(error.error?.description || 'Failed to create subscription');
        }
    }

    async cancelSubscription(subscriptionId: string, cancelAtCycleEnd = false): Promise<void> {
        try {
            await this.instance.subscriptions.cancel(subscriptionId, cancelAtCycleEnd);
        } catch (error: any) {
            console.error('Razorpay Cancel Subscription Error:', error);
            throw new Error(error.error?.description || 'Failed to cancel subscription');
        }
    }

    verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
        const generated_signature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(orderId + '|' + paymentId)
            .digest('hex');

        return generated_signature === signature;
    }

    verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
        return Razorpay.validateWebhookSignature(body, signature, secret);
    }
}
