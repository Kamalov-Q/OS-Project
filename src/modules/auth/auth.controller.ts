import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiCreatedResponse({
    description: 'User registered successfully',
    schema: {
      example: { 
        id: 1,
        username: 'Eshmat Toshmatov',
        pseudoname: 'Qizlarni ajali',
        message: 'Registered successfully',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or username already exists',
  })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'User login and token generation' })
  @ApiOkResponse({
    description: 'Login successful',
    schema: {
      example: {
        access_token: 'jwt.token.here',
        user: {
          id: 1,
          username: 'John Doe',
          pseudoname: 'Eshmatjon',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid username or password',
  })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
