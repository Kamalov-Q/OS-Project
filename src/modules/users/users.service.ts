import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
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
          equals: username,
          mode: 'insensitive',
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findAll() {
    return this.prisma.user.findMany({
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
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.findById(id);

    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
