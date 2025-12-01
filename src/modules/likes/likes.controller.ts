import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { LikesService } from './likes.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  // Like or Unlike
  @UseGuards(AuthGuard('jwt'))
  @Post('toggle/:postId')
  toggleLike(
    @CurrentUser() user: { userId: string },
    @Param('postId') postId: string,
  ) {
    return this.likesService.toggleLike(user.userId, postId);
  }

  // Count likes for a post
  @Get('count/:postId')
  count(@Param('postId') postId: string) {
    return this.likesService.count(postId);
  }

  @Get('list/:postId')
  likers(@Param('postId') postId: string) {
    return this.likesService.getLikers(postId);
  }
}
