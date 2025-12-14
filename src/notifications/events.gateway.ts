import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { NotificationType } from 'generated/prisma';
import { Server, Socket } from 'socket.io';

export type PublicUser = {
  id: string;
  pseudoname: string | null;
  avatarUrl: string | null;
  displayName: string;
};

export type PostEventPayload = {
  id: string;
  userId: string;
  content: string;
  imageUrl: string | null;
  created_at?: Date | string;
  user: PublicUser;
  _count?: { comments?: number; likes?: number; views?: number };
};

export type CommentEventPayload = {
  id: string;
  userId: string;
  postId: string;
  content: string;
  created_at?: Date | string;
  user: PublicUser;
  post?: {
    id: string;
    userId: string;
    content?: string;
    user?: PublicUser;
  };
};

export type LikeEventPayload = {
  id: string;
  userId: string;
  postId: string;
  created_at?: Date | string;
  user: PublicUser;
};

export type FollowEventPayload = {
  id: string;
  followerId: string;
  followedId: string;
  created_at?: Date | string;
  follower: PublicUser;
  followed: PublicUser;
};

@WebSocketGateway({
  cors: { origin: '*' },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers: Map<string, string> = new Map();

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);

    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.connectedUsers.set(userId, client.id);
      client.join(`user:${userId}`);
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);

    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (socketId === client.id) {
        this.connectedUsers.delete(userId);
        break;
      }
    }
  }

  private toPublicUser(user: any): PublicUser {
    const pseudoname = user?.pseudoname ?? null;
    const avatarUrl = user?.avatarUrl ?? null;
    const displayName =
      user?.displayName ??
      pseudoname ??
      (user?.id ? `user-${String(user.id).slice(-6)}` : 'user');

    return {
      id: String(user?.id ?? ''),
      pseudoname,
      avatarUrl,
      displayName,
    };
  }

  private sanitizePost(post: any): PostEventPayload {
    return {
      id: post.id,
      userId: post.userId,
      content: post.content,
      imageUrl: post.imageUrl ?? null,
      created_at: post.created_at,
      user: this.toPublicUser(post.user),
      _count: post._count,
    };
  }

  private sanitizeComment(comment: any): CommentEventPayload {
    return {
      id: comment.id,
      userId: comment.userId,
      postId: comment.postId,
      content: comment.content,
      created_at: comment.created_at,
      user: this.toPublicUser(comment.user),
      post: comment.post
        ? {
            id: comment.post.id,
            userId: comment.post.userId,
            content: comment.post.content,
            user: comment.post.user
              ? this.toPublicUser(comment.post.user)
              : undefined,
          }
        : undefined,
    };
  }

  private sanitizeLike(like: any): LikeEventPayload {
    return {
      id: like.id,
      userId: like.userId,
      postId: like.postId,
      created_at: like.created_at,
      user: this.toPublicUser(like.user),
    };
  }

  private sanitizeFollow(f: any): FollowEventPayload {
    return {
      id: f.id,
      followerId: f.followerId,
      followedId: f.followedId,
      created_at: f.created_at,
      follower: this.toPublicUser(f.follower),
      followed: this.toPublicUser(f.followed),
    };
  }

  emitNewPost(post: PostEventPayload | any) {
    this.server.emit('post:created', this.sanitizePost(post));
  }

  emitPostUpdated(post: PostEventPayload | any) {
    this.server.emit('post:updated', this.sanitizePost(post));
  }

  emitPostDeleted(postId: string) {
    this.server.emit('post:deleted', { postId });
  }

  emitNewComment(comment: CommentEventPayload | any) {
    const safe = this.sanitizeComment(comment);
    this.server.emit('comment:created', safe);

    if (safe?.post?.userId && safe.userId !== safe.post.userId) {
      this.server.to(`user:${safe.post.userId}`).emit('notification', {
        type: NotificationType.NEW_COMMENT,
        message: `${safe.user.displayName} commented on your post`,
        data: safe,
      });
    }
  }

  emitCommentUpdated(comment: CommentEventPayload | any) {
    this.server.emit('comment:updated', this.sanitizeComment(comment));
  }

  emitCommentDeleted(commentId: string) {
    this.server.emit('comment:deleted', { commentId });
  }

  emitNewLike(like: LikeEventPayload | any, post: PostEventPayload | any) {
    const safeLike = this.sanitizeLike(like);
    const safePost = post ? this.sanitizePost(post) : null;

    this.server.emit('like:created', { like: safeLike, post: safePost });

    if (safePost?.userId && safeLike.userId !== safePost.userId) {
      this.server.to(`user:${safePost.userId}`).emit('notification', {
        type: NotificationType.NEW_LIKE,
        message: `${safeLike.user.displayName} liked your post`,
        data: { like: safeLike, post: safePost },
      });
    }
  }

  emitLikeRemove(postId: string, userId: string) {
    this.server.emit('like:removed', { postId, userId });
  }

  emitNewFollow(follower: FollowEventPayload | any) {
    const safe = this.sanitizeFollow(follower);
    this.server.emit('follower:created', safe);

    if (safe?.followedId) {
      this.server.to(`user:${safe.followedId}`).emit('notification', {
        type: NotificationType.NEW_FOLLOW,
        message: `${safe.follower.displayName} started following you`,
        data: safe,
      });
    }
  }

  emitUnFollow(followerId: string, followedId: string) {
    this.server.emit('follow:removed', { followedId, followerId });
  }

  @SubscribeMessage('comment:typing')
  handleTyping(
    client: Socket,
    payload: { postId: string; displayName: string },
  ) {
    client.broadcast.emit('comment:typing', payload);
  }

  @SubscribeMessage('comment:stop-typing')
  handleStopTyping(
    client: Socket,
    payload: { postId: string; displayName: string },
  ) {
    client.broadcast.emit('comment:stop-typing', payload);
  }
}
