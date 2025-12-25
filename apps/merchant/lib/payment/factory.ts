import { PaymentProvider } from './types';
import { RazorpayAdapter } from './razorpay';

export function getPaymentProvider(providerName: string = 'razorpay'): PaymentProvider {
    switch (providerName.toLowerCase()) {
        case 'razorpay':
            return new RazorpayAdapter();
        case 'stripe':
            throw new Error('Stripe not implemented yet');
        case 'phonepe':
            throw new Error('PhonePe not implemented yet');
        default:
            throw new Error(`Unsupported payment provider: ${providerName}`);
    }
}
