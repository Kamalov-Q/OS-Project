import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationType, Post } from 'generated/prisma';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
  ) {}

  //Create and send like notifications
  async createLikeNotifications(postId: string, likerId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { user: true },
    });

    const liker = await this.prisma.user.findUnique({
      where: {
        id: likerId,
      },
    });

    if (!post || !liker || post?.userId === likerId) return;

    //Save notification to database
    const notification = await this.prisma.notification.create({
      data: {
        type: NotificationType.NEW_LIKE,
        userId: post.userId,
        message: `${liker.username} liked your post`,
      },
    });

    //Send real-time notification with full data
    this.gateway.notifyLike(post.userId, liker, postId);
    return notification;
  }

  //Create and send follow notification
  async createFollowNotification(followedId: string, followerId: string) {
    const follower = await this.prisma.user.findUnique({
      where: { id: followerId },
    });

    if (!follower || followedId === followerId) return;

    //Save notification to database
    const notification = await this.prisma.notification.create({
      data: {
        type: NotificationType.NEW_FOLLOW,
        userId: followedId,
        message: `${follower.username} started following you`,
      },
    });

    //Send real-time notification
    this.gateway.notifyFollow(followedId, follower);
    return notification;
  }

  //Create and send comment notification
  async createCommentNotification(
    postId: string,
    commenterId: string,
    commentText: string,
  ) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { user: true },
    });

    if (!post || post?.userId === commenterId) return;

    const commenter = await this.prisma.user.findUnique({
      where: { id: commenterId },
    });

    const notification = await this.prisma.notification.create({
      data: {
        type: NotificationType.NEW_COMMENT,
        userId: post.userId,
        message: `${commenter?.username} commented: ${commentText}`,
      },
    });

    this.gateway.notifyComment(post.userId, commenter, postId, {
      text: commentText,
    });

    return notification;
  }

  //Create and send post notification
  async createNewPostNotification(authorId: string, post: Post) {
    const followers = await this.prisma.follower.findMany({
      where: { followedId: authorId },
    });

    if (followers?.length === 0) return;

    const followerIds = followers?.map((f) => f?.followerId);

    await this.prisma.notification.createMany({
      data: followerIds?.map((id) => ({
        type: NotificationType.NEW_POST,
        userId: id,
        message: `New post from someone you follow`,
      })),
    });

    this.gateway.notifyNewPost(followerIds, post);
  }
}
