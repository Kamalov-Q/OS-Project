import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  Query,
  Put,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PostQueryDto } from './dto/query-post.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt.guard';

@ApiTags('Posts')
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
    return this.postsService.create(user.userId, createPostDto);
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'List posts with search, limit and offset' })
  findAll(
    @Query(ValidationPipe) query: PostQueryDto,
    @CurrentUser() user: { userId: string } | null,
  ) {
    return this.postsService.findAll(user?.userId ?? null, query);
  }

  @Get('user/:userId')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get posts by a user ID' })
  findByUser(
    @Param('userId') userId: string,
    @CurrentUser() user: { userId: string } | null,
  ) {
    return this.postsService.findByUser(user?.userId ?? null, userId);
  }
 
  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get a single post' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string } | null,
  ) {
    return this.postsService.findOne(user?.userId ?? null, id);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a post' })
  update(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postsService.update(id, user.userId, updatePostDto);
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
