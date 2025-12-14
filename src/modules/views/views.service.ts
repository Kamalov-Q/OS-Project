import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ViewsService {
  constructor(private readonly prisma: PrismaService) {}

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
    try {
      const view = await this.prisma.postView.create({
        data: { userId, postId },
      });
      return view;
    } catch (error: any) {
      if (error.code === 'P2002') {
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
