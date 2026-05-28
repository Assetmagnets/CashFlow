import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('owner')
  @Roles(Role.OWNER)
  getOwnerStats() {
    return this.dashboardService.getOwnerStats();
  }

  @Get('supervisor')
  @Roles(Role.SUPERVISOR)
  getSupervisorStats(@CurrentUser('id') userId: string, @Query('siteId') siteId?: string) {
    return this.dashboardService.getSupervisorStats(userId, siteId);
  }

  @Get('middleman')
  @Roles(Role.MIDDLEMAN)
  getMiddlemanStats(@CurrentUser('sub') userId: string) {
    return this.dashboardService.getMiddlemanStats(userId);
  }
}

