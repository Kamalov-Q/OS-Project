import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3000;

  app.enableCors({
    origin: process?.env.CORS_ORIGIN || '*',
    credentials: true,
  });
  app.setGlobalPrefix('api');
  app.useGlobalFilters();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  //Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Content Management')
    .setDescription(
      'A complete content management platform API with real-time features including posts, comments, likes, followers, and WebSocket',
    )
    .setVersion('1.0.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    })
    .addServer('http://localhost:3002', 'Development Server')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  console.log(`Server listening on http://localhost:${port}`);
  console.log(`Swagger running on http://localhost:${port}/api/docs`);
}
bootstrap();
