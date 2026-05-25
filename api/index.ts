console.log('--- API INDEX MODULE LOAD START ---');

let cachedServer: any;

async function bootstrap(): Promise<any> {
  if (cachedServer) {
    return cachedServer;
  }

  // ALL imports must be dynamic to catch initialization errors!
  await import('reflect-metadata');
  const expressModule = await import('express');
  const express = expressModule.default || expressModule;
  
  const server = express();

  // Vercel rewrites preserve the original URL path
  server.use((req: any, _res: any, next: any) => {
    if (req.url && !req.url.startsWith('/api')) {
      req.url = `/api${req.url.startsWith('/') ? '' : '/'}${req.url}`;
    }
    next();
  });

  // Dynamically import NestJS modules to catch import errors
  const { NestFactory } = await import('@nestjs/core');
  const { ValidationPipe } = await import('@nestjs/common');
  const { ExpressAdapter } = await import('@nestjs/platform-express');
  const { AppModule } = await import('../server/src/app.module');
  const { HttpExceptionFilter } = await import('../server/src/common/filters/http-exception.filter');
  const { ResponseInterceptor } = await import('../server/src/common/interceptors/response.interceptor');

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
      message: 'Internal server error during initialization',
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  }
}
