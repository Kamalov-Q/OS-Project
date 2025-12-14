import { Injectable, NotFoundException } from '@nestjs/common';
import { EventsGateway } from 'src/notifications/events.gateway';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class LikesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  private publicUserSelect = {
    id: true,
    pseudoname: true,
    avatarUrl: true,
  };

  private async buildUsernameMap(viewerId: string | null, userIds: string[]) {
    if (!viewerId || userIds.length === 0) return new Map<string, string>();

    const following = await this.prisma.follower.findMany({
      where: { followerId: viewerId },
      select: { followedId: true },
    });

    const canSee = new Set<string>(following.map((f) => f.followedId));
    canSee.add(viewerId);

    const revealIds = userIds.filter((id) => canSee.has(id));
    if (revealIds.length === 0) return new Map();

    const users = await this.prisma.user.findMany({
      where: { id: { in: revealIds } },
      select: { id: true, username: true },
    });

    return new Map(users.map((u) => [u.id, u.username]));
  }

  private attachDisplayName(likes: any[], usernameMap: Map<string, string>) {
    return likes.map((l) => {
      const uname = usernameMap.get(l.userId);
      const displayName = uname ?? l.user.pseudoname;

      return {
        ...l,
        user: {
          ...l.user,
          displayName,
          ...(uname ? { username: uname } : {}),
        },
      };
    });
  }

  async toggleLike(userId: string, postId: string) {
    const existing = await this.prisma.like.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existing) {
      await this.prisma.like.delete({ where: { id: existing.id } });
      this.eventsGateway.emitLikeRemove(postId, userId);
      return { liked: false };
    }

    const like = await this.prisma.like.create({
      data: { userId, postId },
      include: {
        user: { select: this.publicUserSelect },
      },
    });

    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { user: { select: this.publicUserSelect } },
    });

    if (!post) throw new NotFoundException('Post not found');

    const usernameMap = await this.buildUsernameMap(userId, [userId]);
    const shapedLike = this.attachDisplayName([like], usernameMap)[0];

    this.eventsGateway.emitNewLike(shapedLike, post);

    return { liked: true };
  }

  async count(postId: string) {
    const count = await this.prisma.like.count({ where: { postId } });
    return { postId, count };
  }

  async getLikers(viewerId: string | null, postId: string) {
    const likes = await this.prisma.like.findMany({
      where: { postId },
      include: { user: { select: this.publicUserSelect } },
      orderBy: { created_at: 'desc' },
    });

    const likerIds = [...new Set(likes.map((l) => l.userId))];
    const usernameMap = await this.buildUsernameMap(viewerId, likerIds);

    return this.attachDisplayName(likes, usernameMap);
  }

  async checkLikers(userId: string, postId: string) {
    const like = await this.prisma.like.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    return { liked: !!like };
  }
}
