import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EventsModule } from 'src/notifications/events.module';

@Module({
  imports: [PrismaModule, EventsModule],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule { }
