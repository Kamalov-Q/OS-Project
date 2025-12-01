import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class LikesService {
  constructor(private readonly prisma: PrismaService) {}

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

    // Like
    await this.prisma.like.create({
      data: {
        userId,
        postId,
      },
    });

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
}
