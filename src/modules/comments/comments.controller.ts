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

@Controller('comments')
@UseGuards(AuthGuard('jwt'))
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Req() req: RequestWithUser,
    @Body(ValidationPipe) createCommentDto: CreateCommentDto,
  ) {
    const userId = req.user!.userId;
    return this.commentsService.create(userId, createCommentDto);
  }

  @Get()
  findAll(@Query(ValidationPipe) query: CommentQueryDto) {
    return this.commentsService.findAll(query);
  }

  @Get('post/:postId/count')
  countByPost() {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.commentsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body(ValidationPipe) updateCommentDto: UpdateCommentDto,
  ) {
    const userId = req?.user!.userId;
    return this.commentsService.update(id, userId, updateCommentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Req() req: RequestWithUser, @Param('id') id: string) {
    const userId = req?.user!.userId;
    return this.commentsService.remove(id, userId);
  }
}
