// Serverless entry point - exports AppModule and utilities for the Vercel handler
export { AppModule } from './src/app.module';
export { HttpExceptionFilter } from './src/common/filters/http-exception.filter';
export { ResponseInterceptor } from './src/common/interceptors/response.interceptor';
