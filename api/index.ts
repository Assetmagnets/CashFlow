import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
// Import from pre-compiled JavaScript (server/dist/) — NOT TypeScript source!
// Vercel's esbuild does NOT support emitDecoratorMetadata which NestJS requires.
// The NestJS server is pre-compiled with `tsc` during the build step.
import { AppModule } from '../server/dist/src/app.module';
import { HttpExceptionFilter } from '../server/dist/src/common/filters/http-exception.filter';
import { ResponseInterceptor } from '../server/dist/src/common/interceptors/response.interceptor';

let cachedServer: express.Express;

async function bootstrap(): Promise<express.Express> {
  if (cachedServer) {
    return cachedServer;
  }

  const server = express();

  // Vercel rewrites preserve the original URL path (e.g., /api/auth/login).
  // NestJS globalPrefix is 'api', so routes are registered at /api/*.
  server.use((req: any, _res: any, next: any) => {
    if (req.url && !req.url.startsWith('/api')) {
      req.url = `/api${req.url.startsWith('/') ? '' : '/'}${req.url}`;
    }
    next();
  });

  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    logger: ['error', 'warn', 'log'],
  });

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  await app.init();
  cachedServer = server;
  return server;
}

export default async function handler(req: any, res: any) {
  try {
    const server = await bootstrap();
    return server(req, res);
  } catch (error: any) {
    console.error('Serverless bootstrap error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
  }
}
