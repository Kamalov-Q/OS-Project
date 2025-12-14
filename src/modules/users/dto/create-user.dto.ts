import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    example: 'john_doe',
    description: 'Unique username for the user',
    minLength: 3,
  })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({
    example: 'strongPassword123',
    description: 'Account password (will be hashed)',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: 'user-732878' })
  @IsString()
  @IsOptional()
  pseudoname?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/avatars/user1.png',
    description: 'Optional profile avatar URL',
  })
  @IsString()
  @IsOptional()
  avatarUrl?: string;
}
