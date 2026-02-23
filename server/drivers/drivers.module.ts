import { Module } from '@nestjs/common';
import { DriversController } from './drivers.controller';
import { DriverLocationService } from './driver-location.service';

@Module({
  controllers: [DriversController],
  providers: [DriverLocationService],
  exports: [DriverLocationService],
})
export class DriversModule {}
