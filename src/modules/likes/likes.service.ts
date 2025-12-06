import { Injectable } from '@nestjs/common';
import { EventsGateway } from 'src/notifications/events.gateway';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class LikesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async toggleLike(userId: string, postId: string) {
    const existing = await this.prisma.like.findUnique({
      where: {
        postId_userId: { postId, userId },
      },
    });

    if (existing) {
      // Unlike
      await this.prisma.like.delete({
        where: { id: existing?.id },
      });

      return { liked: false };
    }

    this.eventsGateway.emitLikeRemove(postId, userId);

    // Like
    const like = await this.prisma.like.create({
      data: {
        userId,
        postId,
      },
      include: {
        user: true,
      },
    });

    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: true,
      },
    });

    this.eventsGateway.emitNewLike(like, post);

    return { liked: true };
  }

  async count(postId: string) {
    const count = await this.prisma.like.count({
      where: { postId },
    });

    return { postId, count };
  }

  async getLikers(postId: string) {
    return this.prisma.like.findMany({
      where: { postId },
      include: { user: true },
    });
  }

  async checkLikers(userId: string, postId: string) {
    const like = await this.prisma.like.findUnique({
      where: {
        postId_userId: { postId, userId },
      },
    });

    return { liked: !!like };
  }
}
