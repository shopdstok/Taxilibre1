import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('stats')
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('drivers/pending')
  async getPendingDrivers() {
    return this.adminService.getPendingDrivers();
  }

  @Post('drivers/:id/verify')
  async verifyDriver(@Param('id') id: string, @Body() body: { status: string }) {
    return this.adminService.verifyDriver(Number(id), body.status);
  }

  @Get('users')
  async getUsers(@Query('role') role: string) {
    return this.adminService.getUsers(role);
  }

  @Get('rides')
  async getRides() {
    return this.adminService.getRides();
  }
}
