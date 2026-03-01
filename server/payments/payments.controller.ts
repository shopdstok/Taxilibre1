import { Controller, Post, Get, Body, Param, UseGuards, Request, Headers, BadRequestException } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StripeService } from './stripe.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private paymentsService: PaymentsService,
    private stripeService: StripeService
  ) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('create-for-ride')
  @ApiOperation({ summary: 'Create a payment for a ride' })
  async createForRide(@Request() req: any, @Body() body: { rideId: number, method: 'CARD' | 'CASH' }) {
    return this.paymentsService.createForRide(body.rideId, body.method);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  async handleWebhook(
    @Headers('stripe-signature') sig: string,
    @Request() req: RawBodyRequest<any>
  ) {
    if (!sig) throw new BadRequestException('Missing stripe-signature');
    
    try {
      const event = await this.stripeService.constructEvent(req.rawBody, sig);
      return this.paymentsService.handleWebhook(event);
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('all')
  async getAllPayments() {
    return this.paymentsService.getAllPayments();
  }
}
