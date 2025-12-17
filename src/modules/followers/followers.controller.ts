import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FollowersService } from './followers.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthGuard } from '@nestjs/passport';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt.guard';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Followers')
@Controller('followers')
export class FollowersController {
  constructor(private readonly followersService: FollowersService) { }

  // Follow or unfollow a user
  @UseGuards(AuthGuard('jwt'))
  @Post('toggle/:followedId')
  @HttpCode(HttpStatus.CREATED)
  async toggleFollow(
    @CurrentUser() user: { userId: string },
    @Param('followedId') followedId: string,
  ) {
    return this.followersService.toggleFollow(user.userId, followedId);
  }

  // Get users this user is following
  @Get('following/:userId')
  @UseGuards(OptionalJwtAuthGuard)
  getFollowings(
    @Param('userId') userId: string,
    @CurrentUser() viewer: { userId: string } | null,
  ) {
    return this.followersService.getFollowing(userId, viewer?.userId ?? null);
  }

  // Get users following this user
  @Get('followers/:userId')
  @UseGuards(OptionalJwtAuthGuard)
  getFollowers(
    @Param('userId') userId: string,
    @CurrentUser() viewer: { userId: string } | null,
  ) {
    return this.followersService.getFollowers(userId, viewer?.userId ?? null);
  }

  // Count followers
  @Get('count/followers/:userId')
  countFollowers(@Param('userId') userId: string) {
    return this.followersService.countFollowers(userId);
  }

  // Count followings
  @Get('count/following/:userId')
  countFollowings(@Param('userId') userId: string) {
    return this.followersService.countFollowings(userId);
  }

  // Check if current user is following another user
  @Get('check/:followedId')
  @UseGuards(AuthGuard('jwt'))
  checkFollowing(
    @CurrentUser() user: { userId: string },
    @Param('followedId') followedId: string,
  ) {
    return this.followersService.checkFollowing(user.userId, followedId);
  }
}
