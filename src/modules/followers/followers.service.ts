import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateFollowerDto } from './dto/create-follower.dto';
import { UpdateFollowerDto } from './dto/update-follower.dto';
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
  // async 

  findAll() {
    return `This action returns all followers`;
  }

  findOne(id: number) {
    return `This action returns a #${id} follower`;
  }

  update(id: number, updateFollowerDto: UpdateFollowerDto) {
    return `This action updates a #${id} follower`;
  }

  remove(id: number) {
    return `This action removes a #${id} follower`;
  }
}
