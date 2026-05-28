import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { SiteTransferService } from './site-transfer.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('transfers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SiteTransferController {
  constructor(private readonly service: SiteTransferService) {}

  @Post()
  @Roles(Role.OWNER, Role.SUPERVISOR)
  create(@Body() dto: CreateTransferDto, @CurrentUser('sub') userId: string) {
    return this.service.create(dto, userId);
  }

  @Post(':id/receive')
  @Roles(Role.SUPERVISOR, Role.OWNER)
  confirmReceive(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.service.confirmReceive(id, userId);
  }

  @Post(':id/cancel')
  @Roles(Role.OWNER)
  cancelTransfer(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.service.cancelTransfer(id, userId);
  }

  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.service.findAll(query);
  }

  @Get('pending')
  @Roles(Role.SUPERVISOR)
  findPending(@CurrentUser('sub') userId: string) {
    return this.service.findPendingForSupervisor(userId);
  }
}
