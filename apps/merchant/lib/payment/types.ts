export interface CreateSubscriptionParams {
    planId: string;
    customerId?: string; // Optional for Razorpay if not using diff auth
    totalCount?: number; // Total number of billing cycles
    quantity?: number;
    expireBy?: number; // Timestamp
    startAt?: number; // Timestamp
    offerId?: string; // Gateway Offer ID
    notes?: Record<string, string>;
}

export interface PaymentProvider {
    /**
     * Create a new subscription on the gateway
     * @param params Subscription parameters
     * @returns Subscription ID
     */
    createSubscription(params: CreateSubscriptionParams): Promise<string>;

    /**
     * Cancel an existing subscription
     * @param subscriptionId Gateway Subscription ID
     * @param cancelAtCycleEnd If true, cancels at end of current cycle
     */
    cancelSubscription(subscriptionId: string, cancelAtCycleEnd?: boolean): Promise<void>;

    /**
     * Verify a payment signature (client-side flow verification)
     * @param orderId Order/Subscription ID
     * @param paymentId Payment ID
     * @param signature Signature string
     */
    verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean;

    /**
     * Verify a webhook event signature
     * @param body Raw request body
     * @param signature Signature from header
     * @param secret Webhook secret
     */
    verifyWebhookSignature(body: string, signature: string, secret: string): boolean;
}
