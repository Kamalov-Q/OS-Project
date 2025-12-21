import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './utils/error-handler';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3003;

  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    'https://os-project-k18n.onrender.com',
    'https://anonymous-sooty-theta.vercel.app'
  ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });
  app.setGlobalPrefix('api', {
    exclude: [{ path: '/', method: 0 }],
  });
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const formatted = errors.map((e) => ({
          field: e.property,
          errors: e.constraints ? Object.values(e.constraints) : [],
        }));
        return new BadRequestException({
          message: 'Validation failed',
          errors: formatted,
        });
      },
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
    .addServer(`http://localhost:${port}`, 'Development Server')
    .addServer(`https://os-project-k18n.onrender.com/`, 'Production Server')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document, {
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .scheme-container { box-shadow: none; }
    `,
    swaggerOptions: { tagsSorter: 'alpha' },
  });

  await app.listen(port);
  console.log(`Server listening on http://localhost:${port}`);
  console.log(`Swagger running on http://localhost:${port}/api/docs`);
}
bootstrap();
