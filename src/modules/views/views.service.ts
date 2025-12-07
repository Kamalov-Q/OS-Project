import { Injectable } from '@nestjs/common';
import { CreateViewDto } from './dto/create-view.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ViewsService {
  constructor(private readonly prisma: PrismaService) {}
  async create(userId: string, postId: CreateViewDto['postId']) {
    try {
      const view = await this.prisma.postView.create({
        data: { userId, postId },
      });
      return view;
    } catch (error) {
      if (error.code === 'P2002') {
        //Unique constaint (postId + userId)
        return { message: 'Already viewed' };
      }
      throw error;
    }
  }

  async countViews(postId: string) {
    return this.prisma.postView.findMany({
      where: { postId },
      include: {
        user: true,
      },
      orderBy: { viewedAt: 'desc' },
    });
  }

  async userViewedPost(userId: string, postId: string) {
    return this.prisma.postView.findFirst({
      where: { userId, postId },
    });
  }
}
