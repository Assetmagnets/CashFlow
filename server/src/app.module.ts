import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SitesModule } from './modules/sites/sites.module';
import { CashDispatchModule } from './modules/cash-dispatch/cash-dispatch.module';
import { CashReceiptModule } from './modules/cash-receipt/cash-receipt.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { LedgerModule } from './modules/ledger/ledger.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReportsModule } from './modules/reports/reports.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { FileUploadModule } from './modules/file-upload/file-upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    SitesModule,
    CashDispatchModule,
    CashReceiptModule,
    ExpensesModule,
    LedgerModule,
    DashboardModule,
    ReportsModule,
    NotificationsModule,
    FileUploadModule,
  ],
})
export class AppModule {}
