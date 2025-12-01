import { Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}
  create(userId: string, createPostDto: CreatePostDto) {
    const { content, imageUrl } = createPostDto;

    return this.prisma.post.create({
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
  }

  findAll() {
    return this.prisma.post.findMany({
      orderBy: {
        created_at: 'desc',
      },
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
      },
    });
    return post;
  }

  async update(id: string, updatePostDto: UpdatePostDto) {
    await this.findOne(id);
    return this.prisma.post.update({
      where: { id },
      data: updatePostDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.post.delete({
      where: { id },
    });
  }
}
