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

  private attachDisplayName(comments: any[], usernameMap: Map<string, string>) {
    return comments.map((c) => {
      const uname = usernameMap.get(c.userId);
      const displayName = uname ?? c.user.pseudoname;

      return {
        ...c,
        user: {
          ...c.user,
          displayName,
          ...(uname ? { username: uname } : {}),
        },
      };
    });
  }

  async create(userId: string, createCommentDto: CreateCommentDto) {
    const { postId, content } = createCommentDto;

    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        userId: true,
        user: { select: this.publicUserSelect },
      },
    });

    if (!post) throw new NotFoundException('Post not found');

    const comment = await this.prisma.comment.create({
      data: { content, postId, userId },
      include: {
        user: { select: this.publicUserSelect },
        post: {
          include: {
            user: { select: this.publicUserSelect },
          },
        },
      },
    });

    // creator can see own username
    const author = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true },
    });

    const usernameMap = new Map<string, string>();
    if (author) usernameMap.set(author.id, author.username);

    const shaped = this.attachDisplayName([comment], usernameMap)[0];

    this.eventsGateway.emitNewComment(shaped);
    return shaped;
  }

  async findAll(viewerId: string | null, query: CommentQueryDto) {
    const { postId, userId, limit = 20, offset = 0 } = query;

    const where: any = {};
    if (postId) where.postId = postId;
    if (userId) where.userId = userId;

    const comments = await this.prisma.comment.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: { select: this.publicUserSelect },
        post: { select: { id: true, content: true, userId: true } },
      },
    });

    const authorIds = [...new Set(comments.map((c) => c.userId))];
    const usernameMap = await this.buildUsernameMap(viewerId, authorIds);

    return this.attachDisplayName(comments, usernameMap);
  }

  async findOne(viewerId: string | null, id: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: {
        user: { select: this.publicUserSelect },
        post: { select: { id: true, content: true, userId: true } },
      },
    });

    if (!comment) throw new NotFoundException('Comment not found');

    const usernameMap = await this.buildUsernameMap(viewerId, [comment.userId]);
    return this.attachDisplayName([comment], usernameMap)[0];
  }

  async update(id: string, userId: string, updateCommentDto: UpdateCommentDto) {
    const existing = await this.prisma.comment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Comment not found');
    if (existing.userId !== userId)
      throw new ForbiddenException('Not authorized');

    const updated = await this.prisma.comment.update({
      where: { id },
      data: updateCommentDto,
      include: {
        user: { select: this.publicUserSelect },
        post: { include: { user: { select: this.publicUserSelect } } },
      },
    });

    const usernameMap = await this.buildUsernameMap(userId, [updated.userId]);
    const shaped = this.attachDisplayName([updated], usernameMap)[0];

    this.eventsGateway.emitCommentUpdated(shaped);
    return shaped;
  }

  async remove(id: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.userId !== userId)
      throw new ForbiddenException('Not authorized');

    await this.prisma.comment.delete({ where: { id } });

    this.eventsGateway.emitCommentDeleted(id);
    return { deleted: true, id };
  }

  async countByPost(postId: string) {
    const count = await this.prisma.comment.count({ where: { postId } });
    return { postId, count };
  }

  async findByUser(viewerId: string | null, userId: string) {
    const comments = await this.prisma.comment.findMany({
      where: { userId },
      orderBy: { created_at: 'desc' },
      include: {
        user: { select: this.publicUserSelect },
        post: { select: { id: true, content: true, userId: true } },
      },
    });

    const usernameMap = await this.buildUsernameMap(viewerId, [userId]);
    return this.attachDisplayName(comments, usernameMap);
  }
}
