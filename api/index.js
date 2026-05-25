// Pure JavaScript handler — NO TypeScript compilation by Vercel.
// Imports pre-compiled NestJS from server/dist/ (built by `nest build` during buildCommand).
require('reflect-metadata');
const { NestFactory } = require('@nestjs/core');
const { ValidationPipe } = require('@nestjs/common');
const { ExpressAdapter } = require('@nestjs/platform-express');
const express = require('express');

let cachedServer;

async function bootstrap() {
  if (cachedServer) return cachedServer;

  const server = express();

  // Ensure req.url always starts with /api for NestJS route matching
  server.use((req, _res, next) => {
    if (req.url && !req.url.startsWith('/api')) {
      req.url = `/api${req.url.startsWith('/') ? '' : '/'}${req.url}`;
    }
    next();
  });

  // Import pre-compiled NestJS modules from server/dist/
  const { AppModule } = require('../server/dist/src/app.module');
  const { HttpExceptionFilter } = require('../server/dist/src/common/filters/http-exception.filter');
  const { ResponseInterceptor } = require('../server/dist/src/common/interceptors/response.interceptor');

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

module.exports = async (req, res) => {
  try {
    const server = await bootstrap();
    return server(req, res);
  } catch (error) {
    console.error('Serverless bootstrap error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  }
};
