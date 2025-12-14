import { Controller, Get, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { type Response } from 'express';

@ApiExcludeController()
@Controller()
export class RedirectController {
  @Get('/')
  async redirect(@Res() res: Response) {
    return res.redirect('/api');
  }
}
