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
  ) { }

  private publicUserSelect = {
    id: true,
    pseudoname: true,
    avatarUrl: true,
  };

  private async buildUsernameMap(viewerId: string | null, authorIds: string[]) {
    if (!viewerId || authorIds.length === 0) return new Map<string, string>();

    const following = await this.prisma.follower.findMany({
      where: { followerId: viewerId },
      select: { followedId: true },
    });

    const canSee = new Set<string>(following.map((f) => f.followedId));
    canSee.add(viewerId);

    const revealIds = authorIds.filter((id) => canSee.has(id));
    if (revealIds.length === 0) return new Map();

    const authors = await this.prisma.user.findMany({
      where: { id: { in: revealIds } },
      select: { id: true, username: true },
    });

    return new Map(authors.map((a) => [a.id, a.username]));
  }

  private attachDisplayName(posts: any[], usernameMap: Map<string, string>) {
    return posts.map((p) => {
      const uname = usernameMap.get(p.userId);
      const displayName = uname ?? p.user.pseudoname;

      return {
        ...p,
        user: {
          ...p.user,
          displayName,
          ...(uname ? { username: uname } : {}),
        },
      };
    });
  }

  async create(userId: string, createPostDto: CreatePostDto) {
    const { content, imageUrls } = createPostDto;

    const post = await this.prisma.post.create({
      data: { 
        content,
        imageUrls: imageUrls ? (imageUrls as unknown as Prisma.InputJsonValue) : [],
        userId
      },
      include: {
        user: { select: this.publicUserSelect },
        comments: true,
        likes: { include: { user: { select: this.publicUserSelect } } },
        views: { include: { user: { select: this.publicUserSelect } } },
      },
    });

    const author = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true },
    });

    const usernameMap = new Map<string, string>();
    if (author) usernameMap.set(author.id, author.username);

    this.eventsGateway.emitNewPost(post);
    return this.attachDisplayName([post], usernameMap)[0];
  }

  async findAll(viewerId: string | null, query: PostQueryDto) {
    const { search, limit, offset } = query;

    const where: Prisma.PostWhereInput = {};

    if (search && search.trim() !== '') {
      where.OR = [
        { content: { contains: search, mode: 'insensitive' } },
        {
          user: {
            is: { pseudoname: { contains: search, mode: 'insensitive' } },
          },
        },
      ];
    }

    const [posts, total] = await this.prisma.$transaction([
      this.prisma.post.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          user: { select: this.publicUserSelect },
          comments: true,
          likes: { include: { user: { select: this.publicUserSelect } } },
          _count: { select: { comments: true, likes: true, views: true } },
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    const authorIds = [...new Set(posts.map((p) => p.userId))];
    const usernameMap = await this.buildUsernameMap(viewerId, authorIds);

    return {
      data: this.attachDisplayName(posts, usernameMap),
      meta: { total, limit, offset },
    };
  }

  async findOne(viewerId: string | null, id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        user: { select: this.publicUserSelect },
        comments: true,
        likes: { include: { user: { select: this.publicUserSelect } } },
        _count: { select: { comments: true, likes: true, views: true } },
      },
    });

    if (!post) throw new NotFoundException('Post not found');

    const usernameMap = await this.buildUsernameMap(viewerId, [post.userId]);
    return this.attachDisplayName([post], usernameMap)[0];
  }

  async findByUser(viewerId: string | null, userId: string) {
    const posts = await this.prisma.post.findMany({
      where: { userId },
      orderBy: { created_at: 'desc' },
      include: {
        user: { select: this.publicUserSelect },
        _count: { select: { comments: true, likes: true, views: true } },
      },
    });

    const usernameMap = await this.buildUsernameMap(viewerId, [userId]);
    return this.attachDisplayName(posts, usernameMap);
  }

  async update(id: string, userId: string, updatePostDto: UpdatePostDto) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.userId !== userId)
      throw new ForbiddenException('Not authorized to update this post');

    const { imageUrls, ...restDto } = updatePostDto;
    const updatedPost = await this.prisma.post.update({
      where: { id },
      data: {
        ...restDto,
        ...(imageUrls !== undefined
          ? { imageUrls: imageUrls as any }
          : {}),
      },
      include: {
        user: { select: this.publicUserSelect },
        comments: true,
        likes: { include: { user: { select: this.publicUserSelect } } },
      },
    });

    const usernameMap = await this.buildUsernameMap(userId, [
      updatedPost.userId,
    ]);
    const shaped = this.attachDisplayName([updatedPost], usernameMap)[0];

    this.eventsGateway.emitPostUpdated(updatedPost);
    return shaped;
  }

  async remove(id: string, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.userId !== userId)
      throw new ForbiddenException('Not authorized to delete this post');

    await this.prisma.post.delete({ where: { id } });
    this.eventsGateway.emitPostDeleted(id);
    return { deleted: true, id };
  }
}
