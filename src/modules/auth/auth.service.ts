import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register-user.dto';
import { LoginDto } from './dto/login-user.dto';

@Injectable()
export class AuthService {
  private logger = new Logger();
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  private genPseudoname(): string {
    const n = Math.floor(Math.random() * 1_000_000);
    return `user-${String(n).padStart(6, '0')}`;
  }

  async register(registerDto: RegisterDto) {
    const username = registerDto.username.trim().toLowerCase();
    const password = registerDto.password;

    const existingUser = await this.usersService.findByUsername(username);
    if (existingUser) {
      throw new BadRequestException('Username already exists!');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let pseudoname = this.genPseudoname();
    for (let i = 0; i < 10; i++) {
      try {
        const user = await this.usersService.create({
          username,
          password: hashedPassword,
          pseudoname,
        });

        return {
          id: user.id,
          username: user.username,
          pseudoname: user.pseudoname,
          accessToken: this.jwtService.sign({ sub: user.id }),
        };
      } catch (err) {
        if (err?.code === 'P2002') {
          pseudoname = this.genPseudoname();
          continue;
        }
        console.error(err);
        this.logger.error('Error while registering user: ', err);
        throw err;
      }
    }

    throw new BadRequestException(
      'Could not generate unique pseudoname. Try again.',
    );
  }

  async login(loginDto: LoginDto) {
    const { password } = loginDto;
    const username = loginDto.username.trim().toLowerCase();
    const user = await this.usersService.findByUsername(username);

    if (!user) {
      throw new UnauthorizedException('User not found!');
    }

    const ok = await bcrypt.compare(password, user.password);

    if (!ok) {
      throw new UnauthorizedException('Invalid credentials!');
    }

    return {
      id: user.id,
      username: user.username,
      pseudoname: user.pseudoname,
      accessToken: this.jwtService.sign({ sub: user.id }),
    };
  }

  async validateToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
