import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}
  async create(userId: string, createCommentDto: CreateCommentDto) {
    const { postId, content } = createCommentDto;

    const post = await this.prisma.comment.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return this.prisma.comment.create({
      data: {
        content,
        postId,
        userId,
      },
      include: {
        user: true,
        post: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async findAll(postId?: string) {
    return this.prisma.comment.findMany({
      where: postId ? { postId } : undefined,
      orderBy: {
        created_at: 'desc',
      },
      include: {
        user: true,
        post: true,
      },
    });
  }

  async findOne(id: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: {
        user: true,
        post: true,
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
  }

  async update(id: string, userId: string, updateCommentDto: UpdateCommentDto) {
    const comment = await this.findOne(id);

    //Checking ownership
    if (comment.userId !== userId) {
      throw new BadRequestException('Not unauthorized to update this comment');
    }

    return this.prisma.comment.update({
      where: { id },
      data: updateCommentDto,
      include: {
        user: true,
        post: true,
      },
    });
  }

  async remove(id: string, userId: string) {
    const comment = await this.findOne(id);

    //Checking ownership
    if (comment.userId !== userId) {
      throw new BadRequestException('Not unauthorized to update this comment');
    }

    return this.prisma.comment.delete({
      where: { id },
    });
  }

  async countByPost(postId: string) {
    const count = await this.prisma.comment.count({
      where: { postId },
    });

    return { postId, count };
  }
}
