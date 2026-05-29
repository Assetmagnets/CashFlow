import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private eventEmitter: EventEmitter2) {
    super();
  }

  async onModuleInit() {
    await this.$connect();

    // Prisma Middleware to detect when a notification is created
    this.$use(async (params, next) => {
      const result = await next(params);

      if (params.model === 'Notification' && params.action === 'create') {
        // Broadcast the notification creation event
        this.eventEmitter.emit('notification.created', result);
      }

      return result;
    });
  }
}
