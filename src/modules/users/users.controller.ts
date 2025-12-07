import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Post,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateUserDto, UpdateUserDto, UserQueryDto } from './dto/user.dto';

import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiCreatedResponse({
    description: 'User created successfully',
    schema: {
      example: {
        id: '1',
        username: 'john_doe',
        pseudoname: 'John',
        avatarUrl: null,
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or username already exists',
  })
  createUser(@Body() createU: CreateUserDto) {
    return this.usersService.create(createU);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiOkResponse({
    description: 'List of users',
    schema: {
      example: [
        {
          id: '1',
          username: 'john_doe',
          pseudoname: 'John',
          avatarUrl: null,
        },
      ],
    },
  })
  findAll(@Query(ValidationPipe) query: UserQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find user by ID' })
  @ApiOkResponse({
    description: 'User found',
    schema: {
      example: {
        id: '1',
        username: 'john_doe',
        pseudoname: 'John',
        avatarUrl: null,
      },
    },
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Get('username/:username')
  @ApiOperation({ summary: 'Find user by username' })
  @ApiOkResponse({
    description: 'User found by username',
    schema: {
      example: {
        id: '1',
        username: 'john_doe',
        pseudoname: 'John',
        avatarUrl: null,
      },
    },
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  findByUserName(@Param('username') username: string) {
    return this.usersService.findByUsername(username);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a user (requires JWT)' })
  @ApiOkResponse({
    description: 'User updated successfully',
    schema: {
      example: {
        id: '1',
        username: 'john_doe',
        pseudoname: 'Johnny',
        avatarUrl: 'https://example.com/avatar.png',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'User not found' })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.usersService.update(id, updateUserDto, user.userId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete user (requires JWT)' })
  @ApiOkResponse({
    description: 'User deleted successfully',
    schema: {
      example: { message: 'User deleted successfully' },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'User not found' })
  delete(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
    return this.usersService.delete(id, user.userId);
  }
}
