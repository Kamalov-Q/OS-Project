import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EventsGateway } from 'src/notifications/events.gateway';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostQueryDto } from './dto/query-post.dto';
import { Prisma } from 'generated/prisma';

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) { }

  private internalUserSelect = {
    id: true,
    pseudoname: true,
    avatarUrl: true,
    username: true,
  };

  private async buildUsernameMap(
    viewerId: string | null,
    authorIds: string[],
  ): Promise<Map<string, string>> {
    if (!viewerId || authorIds.length === 0) return new Map();

    const following = await this.prisma.follower.findMany({
      where: { followerId: viewerId },
      select: { followedId: true },
    });

    const allowed = new Set(following.map((f) => f.followedId));
    allowed.add(viewerId);

    const revealIds = authorIds.filter((id) => allowed.has(id));
    if (revealIds.length === 0) return new Map();

    const users = await this.prisma.user.findMany({
      where: { id: { in: revealIds } },
      select: { id: true, username: true },
    });

    return new Map(users.map((u) => [u.id, u.username]));
  }

  private attachDisplayName<T extends { user: { id: string; pseudoname: string; username?: string; avatarUrl?: string | null } }>(
    posts: T[],
    usernameMap: Map<string, string>,
  ): (T & { user: { displayName: string; username?: string } })[] {
    return posts.map((p) => {
      const uname = usernameMap.get(p.user.id);
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
    console.log(createPostDto, 'Initial before creation of a post')
    const post = await this.prisma.post.create({
      data: {
        content: createPostDto.content,
        userId,
        imageUrls: createPostDto.imageUrls
          ? (createPostDto.imageUrls as unknown as Prisma.InputJsonValue)
          : [],
      },
      include: {
        user: { select: this.internalUserSelect },
        comments: true,
        likes: { include: { user: { select: this.internalUserSelect } } },
        views: true,
        _count: { select: { likes: true, comments: true, views: true } },
      },
    });
    console.log(post, 'After creation');

    const usernameMap = new Map([
      [
        userId,
        (await this.prisma.user.findUnique({
          where: { id: userId },
          select: { username: true },
        }))?.username ?? '',
      ],
    ]);

    const shaped = this.attachDisplayName([post], usernameMap)[0];

    // Emit socket after shaping the post
    this.eventsGateway.emitNewPost(shaped);

    return shaped;
  }



  async findAll(viewerId: string | null, query: PostQueryDto) {
    const { search, limit = 20, offset = 0 } = query;

    const where: Prisma.PostWhereInput = {};
    if (search?.trim()) {
      where.OR = [
        { content: { contains: search, mode: 'insensitive' } },
        { user: { is: { pseudoname: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const [posts, total] = await this.prisma.$transaction([
      this.prisma.post.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          user: { select: this.internalUserSelect },
          comments: true,
          likes: { include: { user: { select: this.internalUserSelect } } },
          _count: { select: { comments: true, likes: true, views: true } },
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    const authorIds = [...new Set(posts.map((p) => p.user.id))];
    const usernameMap = await this.buildUsernameMap(viewerId, authorIds);

    return { data: this.attachDisplayName(posts, usernameMap), meta: { total, limit, offset } };
  }

  async findOne(viewerId: string | null, id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        user: { select: this.internalUserSelect },
        comments: true,
        likes: { include: { user: { select: this.internalUserSelect } } },
        _count: { select: { comments: true, likes: true, views: true } },
      },
    });
    if (!post) throw new NotFoundException('Post not found');

    const usernameMap = await this.buildUsernameMap(viewerId, [post.user.id]);
    return this.attachDisplayName([post], usernameMap)[0];
  }

  async findByUser(viewerId: string | null, userId: string) {
    const posts = await this.prisma.post.findMany({
      where: { userId },
      orderBy: { created_at: 'desc' },
      include: {
        user: { select: this.internalUserSelect },
        _count: { select: { comments: true, likes: true, views: true } },
        comments: true,
        likes: { include: { user: { select: this.internalUserSelect } } },
        views: { include: { user: { select: this.internalUserSelect } } },
      },
    });

    const usernameMap = await this.buildUsernameMap(viewerId, [userId]);

    return this.attachDisplayName(posts, usernameMap);
  }


  async update(id: string, userId: string, updatePostDto: UpdatePostDto) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.userId !== userId) throw new ForbiddenException('Not authorized');

    const { content, imageUrls } = updatePostDto;
    const updatedPost = await this.prisma.post.update({
      where: { id },
      data: {
        ...(content !== undefined ? { content } : {}),
        ...(imageUrls !== undefined ? { imageUrls: imageUrls as unknown as any } : {}),
      },
      include: {
        user: { select: this.internalUserSelect },
        comments: true,
        likes: { include: { user: { select: this.internalUserSelect } } },
      },
    });

    const usernameMap = await this.buildUsernameMap(userId, [updatedPost.user.id]);
    const shaped = this.attachDisplayName([updatedPost], usernameMap)[0];

    this.eventsGateway.emitPostUpdated(shaped);
    return shaped;
  }

  async remove(id: string, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.userId !== userId) throw new ForbiddenException('Not authorized to delete this post');

    await this.prisma.post.delete({ where: { id } });
    this.eventsGateway.emitPostDeleted(id);
    return { deleted: true, id };
  }
}
