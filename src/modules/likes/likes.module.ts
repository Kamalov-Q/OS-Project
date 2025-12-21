import { Module } from '@nestjs/common';
import { LikesService } from './likes.service';
import { LikesController } from './likes.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EventsModule } from 'src/notifications/events.module';

@Module({
  imports: [PrismaModule, EventsModule],
  controllers: [LikesController],
  providers: [LikesService, PrismaService],
})
export class LikesModule { }
