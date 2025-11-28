import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { username, pseudoname, password } = registerDto;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.usersService.create({
      username,
      pseudoname,
      password: hashedPassword,
    });

    return {
      id: user.id,
      username: user.username,
      pseudoname: user.pseudoname,
      accessToken: this.jwtService.sign({ sub: user.id }),
    };
  }

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;
    const user = await this.usersService.findByUsername(username);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
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
