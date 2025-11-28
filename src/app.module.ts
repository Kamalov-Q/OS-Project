import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { PostsModule } from './modules/posts/posts.module';
import { AuthModule } from './modules/auth/auth.module';
import { CommentsModule } from './modules/comments/comments.module';
import { LikesModule } from './modules/likes/likes.module';
import { FollowersModule } from './modules/followers/followers.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ViewsModule } from './modules/views/views.module';

@Module({
  imports: [PrismaModule, UsersModule, PostsModule, AuthModule, CommentsModule, LikesModule, FollowersModule, NotificationsModule, ViewsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
