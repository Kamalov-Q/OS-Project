import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import {
  Comment,
  Follower,
  Like,
  NotificationType,
  Post,
  User,
} from 'generated/prisma';
import { Server, Socket } from 'socket.io';

type CommentWithRelations = Comment & {
  user: Pick<User, 'id' | 'username' | 'pseudoname' | 'avatarUrl'>;
  post: Post & {
    user: Pick<User, 'id' | 'username' | 'pseudoname'>;
  };
};

type PostWithRelations = Post & {
  user: Pick<User, 'id' | 'username' | 'pseudoname' | 'avatarUrl'>;
};

type LikeWithRelations = Like & {
  user: Pick<User, 'id' | 'username' | 'pseudoname' | 'avatarUrl'>;
};

type FollowerWithRelations = Follower & {
  follower: Pick<User, 'id' | 'username' | 'pseudoname' | 'avatarUrl'>;
  followed: Pick<User, 'id' | 'username' | 'pseudoname' | 'avatarUrl'>;
};

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers: Map<string, string> = new Map();

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client?.id}`);

    const userId = client?.handshake.query.userId as string;
    if (!userId) {
      this.connectedUsers.set(userId, client?.id);
      client.join(`user:${userId}`);
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client?.id}`);

    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (socketId === client?.id) {
        this.connectedUsers.delete(userId);
        break;
      }
    }
  }

  //Post events
  emitNewPost(post: Post) {
    this.server.emit('post:created', post);
  }

  emitPostUpdated(post: Post) {
    this.server.emit('post:updated', post);
  }

  emitPostDeleted(postId: string) {
    this.server.emit('post:deleted', { postId });
  }

  //Comment events
  emitNewComment(comment: CommentWithRelations) {
    this.server.emit('comment:created', comment);

    //Notify post owner
    if (comment?.post?.userId && comment.userId !== comment.post.userId) {
      this.server.to(`user:${comment.post.userId}`).emit('notification', {
        type: NotificationType.NEW_COMMENT,
        message: `${comment.user.username} commented on your post`,
        data: comment,
      });
    }
  }

  emitCommentUpdated(comment: CommentWithRelations) {
    this.server.emit('comment:updated', comment);
  }

  emitCommentDeleted(commentId: string) {
    this.server.emit('comment:deleted', { commentId });
  }
 
  //Like events
  emitNewLike(like: LikeWithRelations, post: PostWithRelations | null) {
    this.server.emit('like:created', { like, post });

    //Notify post owner
    if (post?.userId && like?.userId !== post?.userId) {
      this.server.to(`user:${post?.userId}`).emit('notification', {
        type: NotificationType?.NEW_LIKE,
        message: `${like?.user?.username} liked your post`,
        data: { like, post },
      });
    }
  } 

  emitLikeRemove(postId: string, userId: string) {
    this.server.emit('like:removed', { postId, userId });
  }

  //Follow events
  emitNewFollow(follower: FollowerWithRelations) {
    this.server.emit('follower:created', follower);

    //Notify the followed user
    if (follower?.followedId) {
      this.server.to(`user:${follower?.followedId}`).emit('notification', {
        type: NotificationType?.NEW_FOLLOW,
        message: `${follower?.follower?.username} started following you`,
        data: follower,
      });
    }
  }

  emitUnFollow(followerId: string, followedId: string) {
    this.server.emit('follow:removed', { followedId, followerId });
  }

  //Typing indicator for comments
  @SubscribeMessage('comment:typing')
  handleTyping(client: Socket, payload: { postId: string; username: string }) {
    client.broadcast.emit('comment:typing', payload);
  }

  @SubscribeMessage('comment:stop-typing')
  handleStopTyping(
    client: Socket,
    payload: { postId: string; username: string },
  ) {
    client.broadcast.emit('comment:stop-typing', payload);
  }
}
