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
  Req,
  Query,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { AuthGuard } from '@nestjs/passport';
import { type RequestWithUser } from 'src/interfaces/request-with-user.interface';
import { CommentQueryDto } from './dto/comment-query.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('Comments')
@ApiBearerAuth('JWT-auth')
@Controller('comments')
@UseGuards(AuthGuard('jwt'))
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new comment' })
  @ApiCreatedResponse({ description: 'Comment created successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized to post a comment' })
  create(
    @Req() req: RequestWithUser,
    @Body(ValidationPipe) createCommentDto: CreateCommentDto,
  ) {
    const userId = req.user!.userId;
    return this.commentsService.create(userId, createCommentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get comments with filters (pagination supported)' })
  @ApiQuery({ name: 'postId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  findAll(@Query(ValidationPipe) query: CommentQueryDto) {
    return this.commentsService.findAll(query);
  }

  @Get('post/:postId/count')
  @ApiOperation({ summary: 'Get number of comments for a specific post' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiOkResponse()
  countByPost(@Param('postId') postId: string) {
    return this.commentsService.countByPost(postId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all comments written by a specific user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  findByUser(@Param('userId') userId: string) {
    return this.commentsService.findByUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a comment by ID' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  @ApiOkResponse()
  @ApiNotFoundResponse({ description: 'Comment not found' })
  findOne(@Param('id') id: string) {
    return this.commentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a comment (only author can update)' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  @ApiOkResponse({ description: 'Comment updated successfully' })
  @ApiForbiddenResponse({ description: 'Forbidden: Not the owner' })
  @ApiBody({ type: UpdateCommentDto })
  update(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body(ValidationPipe) updateCommentDto: UpdateCommentDto,
  ) {
    const userId = req?.user!.userId;
    return this.commentsService.update(id, userId, updateCommentDto);
  }

  @Delete(':id')
  @ApiOperation({ description: 'Delete a comment (only author can delete)' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  @ApiNoContentResponse({ description: 'Comment deleted successfully' })
  @ApiForbiddenResponse({ description: 'Forbidden: Not the owner' })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Req() req: RequestWithUser, @Param('id') id: string) {
    const userId = req?.user!.userId;
    return this.commentsService.remove(id, userId);
  }
}
