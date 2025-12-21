import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EventsGateway } from 'src/notifications/events.gateway';

@Injectable()
export class ViewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) { }

  private publicUserSelect = {
    id: true,
    pseudoname: true,
    avatarUrl: true,
  };

  private async buildUsernameMap(viewerId: string, userIds: string[]) {
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

  private attachDisplayName(viewRows: any[], usernameMap: Map<string, string>) {
    return viewRows.map((v) => {
      const uname = usernameMap.get(v.userId);
      const displayName = uname ?? v.user.pseudoname;

      return {
        ...v,
        user: {
          ...v.user,
          displayName,
          ...(uname ? { username: uname } : {}),
        },
      };
    });
  }

  async create(userId: string, postId: string) {
    const postExists = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!postExists) {
      throw new BadRequestException('Post not found');
    }

    try {
      console.log(`🔍 Attempting to create view for user ${userId} on post ${postId}`);

      const view = await this.prisma.postView.create({
        data: { userId, postId },
        include: {
          user: {
            select: {
              id: true,
              pseudoname: true,
              avatarUrl: true,
              username: true,
            },
          },
        },
      });

      console.log(`✅ View created successfully:`, view.id);

      // ✅ Only emit socket event for NEW views
      this.eventsGateway.emitNewView(view, postId);
      console.log('👁️ Emitted view:created event for post:', postId);

      return view;
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log(`⚠️ User ${userId} already viewed post ${postId} - NOT emitting socket event`);
        // ✅ Don't emit socket event for duplicate views
        return { message: 'Already viewed' };
      }
      throw error;
    }
  }

  async countViews(postId: string) {
    const count = await this.prisma.postView.count({
      where: { postId },
    });
    return { postId, views: count };
  }

  async listViewers(viewerId: string, postId: string) {
    const views = await this.prisma.postView.findMany({
      where: { postId },
      include: {
        user: { select: this.publicUserSelect },
      },
      orderBy: { viewedAt: 'desc' },
    });

    const userIds = [...new Set(views.map((v) => v.userId))];
    const usernameMap = await this.buildUsernameMap(viewerId, userIds);

    return this.attachDisplayName(views, usernameMap);
  }

  async userViewedPost(userId: string, postId: string) {
    const viewed = await this.prisma.postView.findFirst({
      where: { userId, postId },
      select: { id: true },
    });

    return { viewed: !!viewed };
  }
}