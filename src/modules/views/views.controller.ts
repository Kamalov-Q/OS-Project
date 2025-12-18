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
import { ApiTags } from '@nestjs/swagger';
import { CreateViewDto } from './dto/create-view.dto';

@ApiTags('Views')
@Controller('views')
@UseGuards(AuthGuard('jwt'))
export class ViewsController {
  constructor(private readonly viewsService: ViewsService) { }

  @Post()
  async createView(@Req() req: any, @Body() dto: CreateViewDto) {
    const { postId } = dto;
    if (!postId) {
      throw new BadRequestException('postId is required');
    }

    const userId = req.user.userId;
    console.log(userId, 'New user')
    return this.viewsService.create(userId, postId);
  }

  @Get('check/:postId')
  async checkViewed(@Req() req: any, @Param('postId') postId: string) {
    const userId = req.user.userId;
    console.log(userId, 'New user')
    return this.viewsService.userViewedPost(userId, postId);
  }

  @Get('count/:postId')
  async getViewCount(@Param('postId') postId: string) {
    return this.viewsService.countViews(postId);
  }

  @Get(':postId')
  async getViewers(@Req() req: any, @Param('postId') postId: string) {
    const viewerId = req.user.userId;
    console.log(viewerId, 'New user')
    return this.viewsService.listViewers(viewerId, postId);
  }
}
