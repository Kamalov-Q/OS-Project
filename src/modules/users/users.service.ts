import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto, UpdateUserDto, UserQueryDto } from './dto/user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createUserDto: CreateUserDto) {
    const { username, pseudoname, password, avatarUrl } = createUserDto;

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ username }, { pseudoname }],
      },
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    if (existingUser) {
      throw new BadRequestException('Username or pseudoname already exists');
    }

    return this.prisma.user.create({
      data: {
        username,
        pseudoname,
        password: hashedPassword,
        avatarUrl,
      },
      select: {
        id: true,
        join_date: true,
        avatarUrl: true,
        username: true,
        pseudoname: true,
      },
    });
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
    const user = await this.prisma.user.findFirst({
      where: {
        username: {
          contains: username,
          mode: 'insensitive',
        },
      },
    });

    console.log(user, username, 'User coming from query');

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
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

  async update(id: string, updateUserDto: UpdateUserDto, userId: string) {
    const user = await this.findById(id);
    if (user.id !== userId) {
      throw new UnauthorizedException();
    }

    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
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
