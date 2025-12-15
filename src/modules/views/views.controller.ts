import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ViewsService } from './views.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('views')
@UseGuards(AuthGuard('jwt'))
export class ViewsController {
  constructor(private readonly viewsService: ViewsService) {}

  @Post()
  async createView(@Req() req: any, @Body('postId') postId: string) {
    if (!postId) {
      throw new BadRequestException('postId is required');
    }

    const userId = req.user.id;
    return this.viewsService.create(userId, postId);
  }

  // IMPORTANT: Put specific routes BEFORE parameterized routes
  @Get('check/:postId')
  async checkViewed(@Req() req: any, @Param('postId') postId: string) {
    const userId = req.user.id;
    return this.viewsService.userViewedPost(userId, postId);
  }

  @Get('count/:postId')
  async getViewCount(@Param('postId') postId: string) {
    return this.viewsService.countViews(postId);
  }

  // This should be LAST because it catches any GET /:postId
  @Get(':postId')
  async getViewers(@Req() req: any, @Param('postId') postId: string) {
    const viewerId = req.user.id;
    return this.viewsService.listViewers(viewerId, postId);
  }
}
