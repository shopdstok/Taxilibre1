import { Module } from '@nestjs/common';
import { RidesService } from './rides.service';
import { RidesController } from './rides.controller';
import { RidesGateway } from './rides.gateway';
import { MatchingService } from './matching.service';
import { DriversModule } from '../drivers/drivers.module';

@Module({
  imports: [DriversModule],
  controllers: [RidesController],
  providers: [RidesService, RidesGateway, MatchingService],
  exports: [RidesService, RidesGateway, MatchingService],
})
export class RidesModule {}
