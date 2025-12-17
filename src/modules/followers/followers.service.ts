import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EventsGateway } from 'src/notifications/events.gateway';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FollowersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) { }

  private publicUserSelect = {
    id: true,
    pseudoname: true,
    avatarUrl: true,
  };

  /** Only show username to allowed viewers (followers + self) */
  private async buildUsernameMap(viewerId: string | null, authorIds: string[]) {
    if (!viewerId || authorIds.length === 0) return new Map<string, string>();

    // Get users followed by the viewer
    const following = await this.prisma.follower.findMany({
      where: { followerId: viewerId },
      select: { followedId: true },
    });

    const canSee = new Set<string>(following.map(f => f.followedId));
    canSee.add(viewerId); // viewer can always see own username

    const revealIds = authorIds.filter(id => canSee.has(id));
    if (revealIds.length === 0) return new Map();

    const authors = await this.prisma.user.findMany({
      where: { id: { in: revealIds } },
      select: { id: true, username: true },
    });

    return new Map(authors.map(a => [a.id, a.username]));
  }

  /** Attach displayName and username conditionally */
  private attachDisplayName(follows: any[], usernameMap: Map<string, string>, key: 'follower' | 'followed') {
    return follows.map(f => {
      const user = f[key];
      const uname = usernameMap.get(user.id);
      const displayName = uname ?? user.pseudoname;

      return {
        ...f,
        [key]: {
          ...user,
          displayName,
          ...(uname ? { username: uname } : {}),
        },
      };
    });
  }

  // Follow or unfollow
  async toggleFollow(followerId: string, followedId: string) {
    if (followerId === followedId) {
      throw new ForbiddenException('You cannot follow yourself');
    }

    const user = await this.prisma.user.findUnique({ where: { id: followedId } });
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.prisma.follower.findUnique({
      where: { followerId_followedId: { followerId, followedId } },
    });

    if (existing) {
      await this.prisma.follower.delete({ where: { id: existing.id } });
      this.eventsGateway.emitUnFollow(followerId, followedId);
      return { following: false };
    }

    const follower = await this.prisma.follower.create({
      data: { followerId, followedId },
      include: { follower: { select: this.publicUserSelect }, followed: { select: this.publicUserSelect } },
    });

    this.eventsGateway.emitNewFollow(follower);
    return { following: true };
  }

  // Get list of users this user follows
  async getFollowing(userId: string, viewerId: string | null = null) {
    const followings = await this.prisma.follower.findMany({
      where: { followerId: userId },
      include: { followed: { select: this.publicUserSelect } },
    });

    const authorIds = followings.map(f => f.followedId);
    const usernameMap = await this.buildUsernameMap(viewerId, authorIds);

    return this.attachDisplayName(followings, usernameMap, 'followed');
  }

  // Get list of followers of this user
  async getFollowers(userId: string, viewerId: string | null = null) {
    const followers = await this.prisma.follower.findMany({
      where: { followedId: userId },
      include: { follower: { select: this.publicUserSelect } },
    });

    const authorIds = followers.map(f => f.followerId);
    const usernameMap = await this.buildUsernameMap(viewerId, authorIds);

    return this.attachDisplayName(followers, usernameMap, 'follower');
  }

  // Count followers
  async countFollowers(userId: string) {
    const count = await this.prisma.follower.count({ where: { followedId: userId } });
    return { userId, followers: count };
  }

  // Count followings
  async countFollowings(userId: string) {
    const count = await this.prisma.follower.count({ where: { followerId: userId } });
    return { userId, following: count };
  }

  // Check if a user follows another
  async checkFollowing(followerId: string, followedId: string) {
    const following = await this.prisma.follower.findUnique({
      where: { followerId_followedId: { followerId, followedId } },
    });
    return { following: !!following };
  }
}
