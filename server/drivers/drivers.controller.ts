import { Controller, Post, Body, UseGuards, Request, Get, Param, ForbiddenException, Patch, Inject } from '@nestjs/common';
import { DriverLocationService } from './driver-location.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('drivers')
@Controller('drivers')
export class DriversController {
  constructor(@Inject(DriverLocationService) private driverLocationService: DriverLocationService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DRIVER')
  @Post('location/update')
  @ApiOperation({ summary: 'Update driver real-time location' })
  async updateLocation(@Request() req: any, @Body() body: { lat: number; lng: number; isAvailable?: boolean }) {
    const location = await this.driverLocationService.updateLocation(req.user.userId, body.lat, body.lng, body.isAvailable);
    return { success: true, ...location };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('location/all')
  @ApiOperation({ summary: 'Get all online drivers locations (Admin only)' })
  async getAllLocations() {
    return this.driverLocationService.getAllOnlineDrivers();
  }
}
