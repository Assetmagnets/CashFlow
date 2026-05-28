import { Module } from '@nestjs/common';
import { MiddlemanController } from './middleman.controller';
import { MiddlemanService } from './middleman.service';

@Module({
  controllers: [MiddlemanController],
  providers: [MiddlemanService],
  exports: [MiddlemanService],
})
export class MiddlemanModule {}
