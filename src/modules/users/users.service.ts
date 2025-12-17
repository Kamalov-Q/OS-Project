import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserQueryDto } from './dto/get-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) { }
  async create(createUserDto: CreateUserDto) {
    const username = createUserDto.username.trim().toLowerCase();
    const pseudoname = createUserDto.pseudoname || `user-${Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0')}`;

    const existingUser = await this.prisma.user.findUnique({ where: { username } });
    if (existingUser) throw new BadRequestException('Username already exists');

    return this.prisma.user.create({
      data: {
        username,
        password: createUserDto.password,
        pseudoname,
        avatarUrl: createUserDto.avatarUrl || null,
      },
      select: { id: true, username: true, pseudoname: true, avatarUrl: true, join_date: true },
    });
  }


  async getMe(userId: string) {
    const u = await this.findById(userId);

    return {
      id: u.id,
      username: u.username,
      pseudoname: u.pseudoname,
      avatarUrl: u.avatarUrl,
      join_date: u.join_date,
      created_at: u.created_at,
      counts: {
        posts: u?._count.posts ?? 0,
        followers: u?._count?.followers ?? 0,
        followings: u?._count.following ?? 0,
      },
    };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: { posts: true, followers: true, following: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByUsername(username: string) {
    const uName = username.trim().toLowerCase();
    return this.prisma.user.findUnique({
      where: {
        username: uName,
      },
    });
  }

  async findAll(query: UserQueryDto) {
    const { username, pseudoname, limit = 20, offset = 0 } = query;

    const where: any = {};

    if (username) {
      where.username = {
        contains: username,
        mode: 'insensitive',
      };
    }

    if (pseudoname) {
      where.pseudoname = {
        contains: pseudoname,
        mode: 'insensitive',
      };
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        select: {
          id: true,
          username: true,
          pseudoname: true,
          avatarUrl: true,
          join_date: true,
          _count: {
            select: { posts: true, followers: true, following: true },
          },
        },
        orderBy: { created_at: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const currentPage = Math.ceil(offset / limit) + 1;

    return {
      users,
      total,
      limit,
      offset,
      totalPages,
      currentPage,
    };
  }

  async update(id: string, data: Partial<{ username: string; password: string; pseudoname: string; avatarUrl: string; refreshToken: string | null }>, userId?: string) {
    if (userId) {
      const user = await this.findById(id);
      if (user.id !== userId) {
        throw new UnauthorizedException();
      }
    }

    return this.prisma.user.update({
      where: { id },
      data,
    });
  }


  async delete(id: string, userId: string) {
    const user = await this.findById(id);
    if (user.id !== userId) {
      throw new UnauthorizedException();
    }

    return this.prisma.user.delete({
      where: { id },
    });
  }
}
