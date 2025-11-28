import { IsString, IsOptional, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(3)
  username: string;

  @IsString()
  @MinLength(3)
  pseudoname: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  pseudoname?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;
}
