import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { MiddlemanService } from './middleman.service';
import { ForwardDispatchDto } from './dto/forward-dispatch.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('middleman')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.MIDDLEMAN)
export class MiddlemanController {
  constructor(private readonly service: MiddlemanService) {}

  @Get('dashboard')
  getDashboard(@CurrentUser('sub') userId: string) {
    return this.service.getDashboardStats(userId);
  }

  @Get('dispatches')
  findAllDispatches(@CurrentUser('sub') userId: string) {
    return this.service.findAllDispatches(userId);
  }

  @Get('dispatches/pending')
  findPending(@CurrentUser('sub') userId: string) {
    return this.service.findPendingDispatches(userId);
  }

  @Post('dispatches/:id/forward')
  forwardDispatch(
    @Param('id') id: string,
    @Body() dto: ForwardDispatchDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.forwardDispatch(id, dto, userId);
  }
}
