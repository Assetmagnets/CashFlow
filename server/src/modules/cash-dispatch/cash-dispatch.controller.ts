import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CashDispatchService } from './cash-dispatch.service';
import { CreateDispatchDto } from './dto/create-dispatch.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('dispatches')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CashDispatchController {
  constructor(private service: CashDispatchService) {}

  @Post()
  @Roles(Role.OWNER)
  create(@Body() dto: CreateDispatchDto, @CurrentUser('sub') userId: string) {
    return this.service.create(dto, userId);
  }

  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.service.findAll(query);
  }

  @Get('pending')
  @Roles(Role.SUPERVISOR)
  findPending(@CurrentUser('sub') userId: string, @Query('siteId') siteId?: string) {
    return this.service.findPending(userId, siteId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
