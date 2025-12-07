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

@Controller('followers')
export class FollowersController {
  constructor(private readonly followersService: FollowersService) {}

  //Follow or unfollow a user
  @UseGuards(AuthGuard('jwt'))
  @Post('toggle/:followedId') 
  @HttpCode(HttpStatus.CREATED)
  async toggleFollow(
    @CurrentUser() user: { userId: string },
    @Param('followedId') followedId: string,
  ) {
    return this.followersService.toggleFollow(user?.userId, followedId);
  }

  @Get('following/:userId')
  getFollowings(@Param('userId') userId: string) {
    return this.followersService.getFollowing(userId);
  }

  @Get('followers/:userId')
  getFollowers(@Param('userId') userId: string) {
    return this.followersService.getFollowers(userId);
  }

  //Count followers
  @Get('count/followers/:userId')
  countFollowers(@Param('userId') userId: string) {
    return this.followersService.countFollowers(userId);
  }

  //Count following
  @Get('count/following/:userId')
  countFollowings(@Param('userId') userId: string) {
    return this.followersService.countFollowings(userId);
  }

  @Get('check/:followedId')
  @UseGuards(AuthGuard('jwt'))
  checkFollowing(
    @CurrentUser() user: { userId: string },
    @Param('followedId') followedId: string,
  ) {
    return this.followersService.checkFollowing(user?.userId, followedId);
  }
}
