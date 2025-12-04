import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FollowersService {
  constructor(private readonly prisma: PrismaService) {}

  //Follow or unfollow
  async toggleFollow(followerId: string, followedId: string) {
    if (followerId === followedId) {
      throw new ForbiddenException('You cannot follow yourself');
    }

    //Check if the followed user exists
    const user = await this.prisma.user.findUnique({
      where: { id: followedId },
    });

    if (!user) throw new NotFoundException('User not found');

    //Check if already following
    const existing = await this.prisma.follower.findUnique({
      where: {
        followerId_followedId: { followerId, followedId },
      },
    });

    if (existing) {
      //Unfollow
      await this.prisma.follower.delete({
        where: { id: existing?.id },
      });

      return { following: false };
    }

    //Follow
    await this.prisma.follower.create({
      data: {
        followedId,
        followerId,
      },
    });

    return { following: true };
  }

  // Get list of followers (people who follow THIS user)
  async getFollowing(userId: string) {
    return await this.prisma.follower.findMany({
      where: { followerId: userId },
      include: {
        followed: true,
      },
    });
  }

  //Count followers
  async countFollowers(userId: string) {
    const count = await this.prisma.follower.count({
      where: {
        followerId: userId,
      },
    });

    return { userId, followers: count };
  }

  // Count followings
  async countFollowings(userId: string) {
    const count = await this.prisma.follower.count({
      where: { followedId: userId },
    });

    return { userId, following: count };
  }
}
