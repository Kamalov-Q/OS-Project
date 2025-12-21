import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EventsModule } from 'src/notifications/events.module';

@Module({
  imports: [PrismaModule, EventsModule],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule { }
