import { Global, Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';

@Global()
@Module({
  imports: [],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
