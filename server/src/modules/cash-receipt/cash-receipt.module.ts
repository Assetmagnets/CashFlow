import { Module } from '@nestjs/common';
import { CashReceiptController } from './cash-receipt.controller';
import { CashReceiptService } from './cash-receipt.service';

@Module({
  controllers: [CashReceiptController],
  providers: [CashReceiptService],
  exports: [CashReceiptService],
})
export class CashReceiptModule {}
