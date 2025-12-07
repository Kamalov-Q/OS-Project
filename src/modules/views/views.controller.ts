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
  Req,
} from '@nestjs/common';
import { ViewsService } from './views.service';
import { CreateViewDto } from './dto/create-view.dto';
import { UpdateViewDto } from './dto/update-view.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { type RequestWithUser } from 'src/interfaces/request-with-user.interface';

@ApiTags('Views')
@ApiBearerAuth('JWT-auth')
@Controller('views')
@UseGuards(AuthGuard('jwt'))
export class ViewsController {
  constructor(private readonly viewsService: ViewsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Mark post as viewed by current user' })
  @ApiCreatedResponse({
    description: 'View added or ignored if already viewed',
  })
  create(@Req() req: RequestWithUser, @Body() createViewDto: CreateViewDto) {
    const userId = req.user?.userId as string;
    const { postId } = createViewDto;
    return this.viewsService.create(userId, postId);
  }

  @Get('post/:postId/count')
  @ApiOperation({ summary: 'Get total number of views for a post' })
  @ApiOkResponse()
  count(@Param('postId') postId: string) {
    return this.viewsService.countViews(postId);
  }

  @Get('post/:postId/users')
  @ApiOperation({ summary: 'Get users who viewed a post' })
  @ApiOkResponse()
  findUsers(@Req() user: { userId: string }, @Param('postId') postId: string) {
    return this.viewsService.userViewedPost(user.userId, postId);
  }
}
