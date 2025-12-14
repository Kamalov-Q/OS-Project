import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({
    example: 'john_doe',
    description: 'Unique username for the user',
    minLength: 3,
  })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/avatars/new-avatar.png',
    description: 'Updated avatar URL',
  })
  @IsString()
  @IsOptional()
  avatarUrl?: string;
}
