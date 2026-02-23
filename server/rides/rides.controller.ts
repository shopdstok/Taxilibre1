import { Controller, Post, Get, Body, Param, UseGuards, Request, ForbiddenException, NotFoundException } from '@nestjs/common';
import { RidesService } from './rides.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DriverLocationService } from '../drivers/driver-location.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('rides')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rides')
export class RidesController {
  constructor(
    private ridesService: RidesService,
    private driverLocationService: DriverLocationService
  ) {}

  @Post('request')
  async requestRide(@Request() req: any, @Body() body: any) {
    return this.ridesService.createRide(req.user.userId, body);
  }

  @Get(':id')
  async getRide(@Param('id') id: string) {
    return this.ridesService.getRide(Number(id));
  }

  @Post(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: string, driverId?: number }) {
    return this.ridesService.updateStatus(Number(id), body.status, body.driverId);
  }

  @Get(':id/driver-location')
  @ApiOperation({ summary: 'Get real-time location of the assigned driver' })
  async getDriverLocation(@Param('id') id: string, @Request() req: any) {
    const ride: any = await this.ridesService.getRide(Number(id));
    if (!ride) throw new NotFoundException('Ride not found');
    
    // Security check: only assigned passenger or admin can see location
    if (req.user.role === 'PASSENGER' && ride.passenger_id !== req.user.userId) {
      throw new ForbiddenException('You are not authorized to track this ride');
    }

    if (!ride.driver_id) {
      throw new NotFoundException('No driver assigned to this ride yet');
    }

    const location = await this.driverLocationService.getLocation(ride.driver_id);
    if (!location) {
      throw new NotFoundException('Driver location not available');
    }

    return location;
  }
}
