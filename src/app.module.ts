import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PostsModule } from './modules/posts/posts.module';
import { LikesModule } from './modules/likes/likes.module';
import { FollowersModule } from './modules/followers/followers.module';
import { EventsModule } from './notifications/events.module';
import { CommentsModule } from './modules/comments/comments.module';
import { HealthController } from './modules/health/health.controller';
import { RedirectController } from './modules/redirect/redirect.controller';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { UploadController } from './modules/upload/upload.controller';
import { ViewsModule } from './modules/views/views.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
      serveRoot: '/public',
    }),
    EventsModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    PostsModule,
    CommentsModule,
    LikesModule,
    FollowersModule,
    ViewsModule,
  ],
  controllers: [HealthController, RedirectController, UploadController],
})
export class AppModule {}
