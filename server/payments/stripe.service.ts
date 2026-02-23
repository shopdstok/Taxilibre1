import { Injectable, OnModuleInit } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService implements OnModuleInit {
  private stripe: Stripe;

  onModuleInit() {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      console.warn('STRIPE_SECRET_KEY is not set. Stripe integration will be disabled.');
      return;
    }
    this.stripe = new Stripe(apiKey, {
      apiVersion: '2025-02-11-preview' as any,
    });
  }

  async createPaymentIntent(amount: number, currency: string = 'eur', metadata: any = {}) {
    if (!this.stripe) throw new Error('Stripe is not configured');
    
    return this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects cents
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });
  }

  async constructEvent(payload: string | Buffer, sig: string) {
    if (!this.stripe) throw new Error('Stripe is not configured');
    
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET is not set');

    return this.stripe.webhooks.constructEvent(payload, sig, webhookSecret);
  }

  async getPaymentIntent(id: string) {
    if (!this.stripe) throw new Error('Stripe is not configured');
    return this.stripe.paymentIntents.retrieve(id);
  }
}
