import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { MapsService } from './maps.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('maps')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('maps')
export class MapsController {
  constructor(private mapsService: MapsService) {}

  @Get('estimate')
  async getEstimate(@Query('origin') origin: string, @Query('destination') destination: string) {
    return this.mapsService.getEstimate(origin, destination);
  }

  @Get('autocomplete')
  async autocomplete(@Query('input') input: string) {
    return this.mapsService.autocomplete(input);
  }
}
