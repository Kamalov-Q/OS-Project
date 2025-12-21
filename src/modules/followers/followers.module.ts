import { Module } from '@nestjs/common';
import { FollowersService } from './followers.service';
import { FollowersController } from './followers.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EventsModule } from 'src/notifications/events.module';

@Module({
  imports: [PrismaModule, EventsModule],
  controllers: [FollowersController],
  providers: [FollowersService, PrismaService],
})
export class FollowersModule { }
