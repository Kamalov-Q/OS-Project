import { Controller, Get, Res } from '@nestjs/common';
import { type Response } from 'express';
@Controller()
export class RedirectController {
  @Get('/')
  async redirect(@Res() res: Response) {
    return res.redirect('/api');
  }
}
