import { Module } from '@nestjs/common';
import { ViewsController } from './views.controller';
import { ViewsService } from './views.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EventsModule } from 'src/notifications/events.module';

@Module({
  imports: [PrismaModule, EventsModule],
  controllers: [ViewsController],
  providers: [ViewsService],
  exports: [ViewsService],
})
export class ViewsModule { }