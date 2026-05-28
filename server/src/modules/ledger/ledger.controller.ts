import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('ledger')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Get()
  findAll(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
    @Query() query: PaginationDto,
    @Query('siteId') siteId?: string,
    @Query('transactionType') transactionType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.ledgerService.findAll(
      { ...query, siteId, transactionType, startDate, endDate },
      userId,
      role,
    );
  }

  @Get('site/:siteId')
  findBySite(
    @Param('siteId') siteId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
    @Query() query: PaginationDto,
    @Query('transactionType') transactionType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.ledgerService.findBySite(
      siteId,
      { ...query, transactionType, startDate, endDate },
      userId,
      role,
    );
  }

  @Get('middleman')
  findMiddlemanLedger(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
    @Query() query: PaginationDto,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.ledgerService.findMiddlemanLedger(
      { ...query, startDate, endDate },
      userId,
      role,
    );
  }
}
