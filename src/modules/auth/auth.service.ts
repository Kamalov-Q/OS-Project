import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register-user.dto';
import { LoginDto } from './dto/login-user.dto';

@Injectable()
export class AuthService {
  private ACCESS_TOKEN_TTL = '30m';
  private REFRESH_TOKEN_TTL = '1d';

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) { }

  private genPseudoname(): string {
    const n = Math.floor(Math.random() * 1_000_000);
    return `user-${String(n).padStart(6, '0')}`;
  }

  private async signTokens(userId: string) {
    const accessToken = this.jwtService.sign({ sub: userId }, { expiresIn: this.ACCESS_TOKEN_TTL });
    const refreshToken = this.jwtService.sign({ sub: userId }, { expiresIn: this.REFRESH_TOKEN_TTL });

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.usersService.update(userId, { refreshToken: hashedRefreshToken });

    return { accessToken, refreshToken };
  }


  async register(dto: RegisterDto) {
    const username = dto.username.trim().toLowerCase();
    const password = dto.password;

    // Check for existing user
    if (await this.usersService.findByUsername(username)) {
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

        const tokens = await this.signTokens(user.id);

        return {
          user: { id: user.id, username, pseudoname },
          ...tokens,
        };
      } catch (err: any) {
        if (err?.code === 'P2002') pseudoname = this.genPseudoname();
        else throw err;
      }
    }

    throw new BadRequestException('Could not generate unique pseudoname');
  }

  async login(dto: LoginDto) {
    const username = dto.username.trim().toLowerCase();
    const user = await this.usersService.findByUsername(username);

    if (!user) throw new UnauthorizedException('User not found!');
    if (!(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials!');
    }

    const tokens = await this.signTokens(user.id);

    return {
      user: { id: user.id, username: user.username, pseudoname: user.pseudoname },
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.usersService.findById(payload.sub);

      if (!user?.refreshToken || !(await bcrypt.compare(refreshToken, user.refreshToken))) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.signTokens(user.id);
      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    await this.usersService.update(userId, { refreshToken: null });
    return { success: true };
  }

}
