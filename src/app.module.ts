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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EventsModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    PostsModule,
    CommentsModule,
    LikesModule,
    FollowersModule,
  ],
  controllers: [HealthController, RedirectController],
})
export class AppModule {}
