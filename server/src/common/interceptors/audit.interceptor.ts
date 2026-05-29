import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // Only log state-changing requests
    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      const user = request.user;
      const url = request.url;
      const body = { ...request.body };

      // Mask sensitive fields
      if (body.password) body.password = '***';
      if (body.newPassword) body.newPassword = '***';
      if (body.otp) body.otp = '***';

      return next.handle().pipe(
        tap(async () => {
          try {
            // Log successful actions asynchronously to avoid blocking the response
            await this.prisma.auditLog.create({
              data: {
                userId: user?.sub || user?.id || null, // Can be null if public endpoint like login
                action: `${method} ${url}`,
                entity: url.split('/')[2] || 'unknown', // e.g., /api/users -> users
                ipAddress: request.ip,
                newValue: JSON.stringify(body).substring(0, 5000), // Cap length
              },
            });
          } catch (error) {
            console.error('Failed to write audit log:', error);
          }
        }),
      );
    }

    return next.handle();
  }
}
