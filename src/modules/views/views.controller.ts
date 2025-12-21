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
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CreateViewDto } from './dto/create-view.dto';

@ApiTags('Views')
@ApiBearerAuth()
@Controller('views')
@UseGuards(AuthGuard('jwt'))
export class ViewsController {
  constructor(private readonly viewsService: ViewsService) { }

  @Post()
  @ApiOperation({ summary: 'Create a view for a post' })
  async createView(@Req() req: any, @Body() dto: CreateViewDto) {
    const { postId } = dto;
    if (!postId) {
      throw new BadRequestException('postId is required');
    }

    const userId = req.user.userId;
    return this.viewsService.create(userId, postId);
  }

  @Get('check/:postId')
  @ApiOperation({ summary: 'Check if user has viewed a post' })
  async checkViewed(@Req() req: any, @Param('postId') postId: string) {
    const userId = req.user.userId;
    return this.viewsService.userViewedPost(userId, postId);
  }

  @Get('count/:postId')
  @ApiOperation({ summary: 'Get view count for a post' })
  async getViewCount(@Param('postId') postId: string) {
    return this.viewsService.countViews(postId);
  }

  @Get(':postId')
  @ApiOperation({ summary: 'Get all viewers of a post' })
  async getViewers(@Req() req: any, @Param('postId') postId: string) {
    const viewerId = req.user.userId;
    return this.viewsService.listViewers(viewerId, postId);
  }
}