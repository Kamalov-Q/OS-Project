import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { LikesService } from './likes.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt.guard';

@ApiTags('Likes') 
@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Post('toggle/:postId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle like on a post' })
  toggleLike(
    @CurrentUser() user: { userId: string },
    @Param('postId') postId: string,
  ) {
    return this.likesService.toggleLike(user.userId, postId);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('post/:postId')
  @ApiOperation({ summary: 'Get users who liked a post' })
  getLikers(@Req() req: any, @Param('postId') postId: string) {
    const viewerId = req.user?.userId ?? null;
    return this.likesService.getLikers(viewerId, postId);
  }

  @Get('check/:postId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if current user liked a post' })
  checkLiked(
    @CurrentUser() user: { userId: string },
    @Param('postId') postId: string,
  ) {
    return this.likesService.checkLikers(user.userId, postId);
  }
}
