import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PostQueryDto } from './dto/query-post.dto';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new post' })
  create(
    @Body(ValidationPipe) createPostDto: CreatePostDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.postsService.create(user.userId as string, createPostDto);
  }

  @Get()
  @ApiOperation({
    summary: 'List posts with search, limit and offset',
  })
  findAll(@Query(ValidationPipe) query: PostQueryDto) {
    return this.postsService.findAll(query);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get posts by a user ID' })
  findByUser(@Param('userId') userId: string) {
    return this.postsService.findByUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single post' })
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a post' })
  update(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postsService.update(id, user?.userId, updatePostDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a post' })
  remove(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.postsService.remove(id, user.userId);
  }
}
