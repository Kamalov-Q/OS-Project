import { Controller, Get } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller()
export class HealthController {
  @Get('/')
  health() {
    return { ok: true, status: 'Server is working' };
  }
}
