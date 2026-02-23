import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DriversModule } from './drivers/drivers.module';
import { RidesModule } from './rides/rides.module';
import { PaymentsModule } from './payments/payments.module';
import { AdminModule } from './admin/admin.module';
import { MapsModule } from './maps/maps.module';
import { SupabaseModule } from './supabase/supabase.module';

@Module({
  imports: [
    SupabaseModule,
    AuthModule,
    UsersModule,
    DriversModule,
    RidesModule,
    PaymentsModule,
    AdminModule,
    MapsModule,
  ],
})
export class AppModule {}
