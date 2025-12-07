import { Module } from '@nestjs/common';
import { ViewsService } from './views.service';
import { ViewsController } from './views.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [ViewsController],
  providers: [ViewsService, PrismaService],
  exports: [ViewsService],
})
export class ViewsModule {}
