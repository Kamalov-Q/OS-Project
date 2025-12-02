import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { FollowersService } from './followers.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthGuard } from '@nestjs/passport';

@Controller('followers')
export class FollowersController {
  constructor(private readonly followersService: FollowersService) {}

  //Follow or unfollow a user
  @UseGuards(AuthGuard('jwt'))
  @Post('toggle/:userId')
  async toggleFollow(
    @CurrentUser() user: { userId: string },
    @Param('userId') followedId: string,
  ) {
    console.log(user?.userId, 'Follower Id');
    return this.followersService.toggleFollow(user?.userId, followedId);
  }

  // List of users who follow this user
  @Get('list/followers/:userId')
  getFollowers(@Param('userId') userId: string) {
    return this.followersService.getFollowing(userId);
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
}
