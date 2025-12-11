import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { EventsGateway } from 'src/notifications/events.gateway';
import { PostQueryDto } from './dto/query-post.dto';
import { Prisma } from 'generated/prisma';

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}
  async create(userId: string, createPostDto: CreatePostDto) {
    const { content, imageUrl } = createPostDto;

    const post = await this.prisma.post.create({
      data: {
        content,
        imageUrl: imageUrl ? imageUrl : null,
        userId,
      },
      include: {
        user: true,
        comments: true,
        likes: {
          include: {
            user: true,
          },
        },
        views: {
          include: {
            user: true,
          },
        },
      },
    });

    this.eventsGateway.emitNewPost(post);
    return post;
  }

  async findAll(query: PostQueryDto) {
    const { search, limit, offset } = query;

    const where: Prisma.PostWhereInput = {};

    if (search && search?.trim() !== '') {
      where.OR = [
        {
          content: { contains: search, mode: 'insensitive' },
        },
        {
          user: { is: { username: { contains: search, mode: 'insensitive' } } },
        },
        {
          user: {
            is: { pseudoname: { contains: search, mode: 'insensitive' } },
          },
        },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.post.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          user: true,
          comments: true,
          likes: { include: { user: true } },
          _count: { select: { comments: true, likes: true, views: true } },
        },
      }),

      this.prisma.post.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        limit,
        offset,
      },
    };
  }

  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        user: true,
        comments: true,
        likes: {
          include: {
            user: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
            views: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  async update(id: string, userId: string, updatePostDto: UpdatePostDto) {
    const post = await this.findOne(id);
    if (post?.userId !== userId) {
      throw new ForbiddenException('Not authorized to update this post');
    }

    const updatedPost = await this.prisma.post.update({
      where: { id },
      data: updatePostDto,
      include: {
        user: true,
        comments: true,
        likes: {
          include: {
            user: true,
          },
        },
      },
    });

    this.eventsGateway.emitPostUpdated(updatedPost);

    return updatedPost;
  }

  async remove(id: string, userId: string) {
    const post = await this.findOne(id);

    if (post?.userId !== userId) {
      throw new ForbiddenException('Not authorized to delete this post');
    }

    await this.prisma.post.delete({
      where: { id },
    });

    this.eventsGateway.emitPostDeleted(id);
    return {
      deleted: true,
      id,
    };
  }

  async findByUser(userId: string) {
    return this.prisma.post.findMany({
      where: { userId },
      orderBy: {
        created_at: 'desc',
      },
      include: {
        user: true,
        _count: {
          select: {
            comments: true,
            likes: true,
            views: true,
          },
        },
      },
    });
  }
}
