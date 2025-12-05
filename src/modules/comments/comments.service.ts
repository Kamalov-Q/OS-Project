import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { EventsGateway } from 'src/notifications/events.gateway';
import { CommentQueryDto } from './dto/comment-query.dto';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}
  async create(userId: string, createCommentDto: CreateCommentDto) {
    const { postId, content } = createCommentDto;

    const post = await this.prisma.comment.findUnique({
      where: { id: postId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            pseudoname: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const comment = await this.prisma.comment.create({
      data: {
        content,
        postId,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            pseudoname: true,
            avatarUrl: true,
          },
        },
        post: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                pseudoname: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    // Properly await the comment creation and emit event with the resolved data

    //Should be fixed
    const createdComment = comment;
    this.eventsGateway.emitNewComment(createdComment);
  }

  async findAll(query: CommentQueryDto) {
    const { postId, userId, limit = 20, offset = 0 } = query;
    const where: any = {};
    if (postId) where.postId = postId;
    if (userId) where.userId = userId;

    return this.prisma.comment.findMany({
      where,
      orderBy: {
        created_at: 'desc',
      },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            pseudoname: true,
            avatarUrl: true,
          },
        },
        post: {
          select: {
            id: true,
            content: true,
            userId: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            pseudoname: true,
            avatarUrl: true,
          },
        },
        post: {
          select: {
            id: true,
            content: true,
            userId: true,
          },
        },
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
      throw new ForbiddenException('Not unauthorized to update this comment');
    }

    const updatedComment = await this.prisma.comment.update({
      where: { id },
      data: updateCommentDto,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            pseudoname: true,
            avatarUrl: true,
          },
        },
        post: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                pseudoname: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    //Emit WebSocket event
    this.eventsGateway.emitCommentUpdated(updatedComment);

    return updatedComment;
  }

  async remove(id: string, userId: string) {
    const comment = await this.findOne(id);

    //Checking ownership
    if (comment.userId !== userId) {
      throw new ForbiddenException('Not unauthorized to update this comment');
    }

    await this.prisma.comment.delete({
      where: { id },
    });

    //Emit WebSocket event
    this.eventsGateway.emitCommentDeleted(id);
    return {
      deleted: true,
      id,
    };
  }

  async countByPost(postId: string) {
    const count = await this.prisma.comment.count({
      where: { postId },
    });

    return { postId, count };
  }

  async findByUser(userId: string) {
    return this.prisma.comment.findMany({
      where: { userId },
      orderBy: {
        created_at: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            pseudoname: true,
            avatarUrl: true,
          },
        },
        post: {
          select: {
            id: true,
            content: true,
            userId: true,
          },
        },
      },
    });
  }
}
