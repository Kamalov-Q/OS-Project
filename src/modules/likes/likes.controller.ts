import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { LikesService } from './likes.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  // Like or Unlike
  @UseGuards(AuthGuard('jwt'))
  @Post('toggle/:postId')
  @HttpCode(HttpStatus.OK)
  toggleLike(
    @CurrentUser() user: { userId: string },
    @Param('postId') postId: string,
  ) {
    return this.likesService.toggleLike(user.userId, postId);
  }

  @Get('post/:postId')
  getLikers(@Param('postId') postId: string) {
    return this.likesService.getLikers(postId);
  }

  @Get('check/:postId')
  @UseGuards(AuthGuard('jwt'))
  checkLiked(
    @CurrentUser() user: { userId: string },
    @Param('postId') postId: string,
  ) {
    return this.likesService.checkLikers(user.userId, postId);
  }
}
