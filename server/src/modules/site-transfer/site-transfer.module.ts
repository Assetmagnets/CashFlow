import { Module } from '@nestjs/common';
import { SiteTransferController } from './site-transfer.controller';
import { SiteTransferService } from './site-transfer.service';

@Module({
  controllers: [SiteTransferController],
  providers: [SiteTransferService],
  exports: [SiteTransferService],
})
export class SiteTransferModule {}
