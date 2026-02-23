import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../common/database.service';
import { StripeService } from './stripe.service';

@Injectable()
export class PaymentsService {
  constructor(
    private databaseService: DatabaseService,
    private stripeService: StripeService,
  ) {}

  async createForRide(rideId: number, method: 'CARD' | 'CASH') {
    const ride: any = this.databaseService.get('SELECT * FROM rides WHERE id = ?', [rideId]);
    if (!ride) throw new NotFoundException('Ride not found');
    
    if (ride.status === 'COMPLETED' || ride.status === 'CANCELED') {
      throw new BadRequestException('Ride is already finished or canceled');
    }

    const commissionRate = 0.2; // 20%
    const commission = ride.price_total * commissionRate;
    const driverPayout = ride.price_total - commission;

    if (method === 'CASH') {
      this.databaseService.run(
        'INSERT INTO payments (ride_id, method, amount, commission, driver_payout, status) VALUES (?, ?, ?, ?, ?, ?)',
        [rideId, 'CASH', ride.price_total, commission, driverPayout, 'PENDING_CASH']
      );
      return { status: 'PENDING_CASH' };
    }

    // CARD Payment
    const paymentIntent = await this.stripeService.createPaymentIntent(ride.price_total, 'eur', {
      rideId: rideId.toString(),
    });

    this.databaseService.run(
      'INSERT INTO payments (ride_id, method, stripe_payment_intent_id, amount, commission, driver_payout, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [rideId, 'CARD', paymentIntent.id, ride.price_total, commission, driverPayout, 'PENDING']
    );

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      status: 'PENDING',
    };
  }

  async handleWebhook(event: any) {
    const intent = event.data.object;
    const rideId = intent.metadata.rideId;

    switch (event.type) {
      case 'payment_intent.succeeded':
        this.updatePaymentStatus(intent.id, 'SUCCEEDED', rideId);
        break;
      case 'payment_intent.payment_failed':
        this.updatePaymentStatus(intent.id, 'FAILED', rideId);
        break;
    }
  }

  private updatePaymentStatus(intentId: string, status: string, rideId: string) {
    this.databaseService.run(
      'UPDATE payments SET status = ? WHERE stripe_payment_intent_id = ?',
      [status, intentId]
    );

    if (status === 'SUCCEEDED') {
      this.databaseService.run(
        'UPDATE rides SET payment_status = "PAID" WHERE id = ?',
        [rideId]
      );
    } else if (status === 'FAILED') {
      this.databaseService.run(
        'UPDATE rides SET payment_status = "FAILED" WHERE id = ?',
        [rideId]
      );
    }
  }

  async getAllPayments() {
    return this.databaseService.query(`
      SELECT p.*, r.pickup_address, r.dropoff_address, u.name as passengerName
      FROM payments p
      JOIN rides r ON p.ride_id = r.id
      JOIN users u ON r.passenger_id = u.id
      ORDER BY p.created_at DESC
    `);
  }
}
