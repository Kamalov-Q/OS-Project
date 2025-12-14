import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const req = ctx.getRequest();

    const isHttp = exception instanceof HttpException;
    const status = isHttp
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const responseBody = isHttp
      ? exception.getResponse()
      : { message: 'Internal server error' };

    // Don’t leak stack traces in production
    res.status(status).json({
      statusCode: status,
      path: req.url,
      ...(typeof responseBody === 'string'
        ? { message: responseBody }
        : responseBody),
    });
  }
}
