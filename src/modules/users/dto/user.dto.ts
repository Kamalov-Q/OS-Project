import { IsString, IsOptional, MinLength, Min, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

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
    example: 'John',
    description: 'Publicly displayed pseudoname',
    minLength: 3,
  })
  @IsString()
  @MinLength(3)
  pseudoname: string;

  @ApiProperty({
    example: 'strongPassword123',
    description: 'Account password (will be hashed)',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/avatars/user1.png',
    description: 'Optional profile avatar URL',
  })
  @IsString()
  @IsOptional()
  avatarUrl?: string;
}

export class UpdateUserDto {
  @ApiProperty({
    example: 'john_doe',
    description: 'Unique username for the user',
    minLength: 3,
  })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiPropertyOptional({
    example: 'Johnny',
    description: 'New pseudoname',
  })
  @IsString()
  @IsOptional()
  pseudoname?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/avatars/new-avatar.png',
    description: 'Updated avatar URL',
  })
  @IsString()
  @IsOptional()
  avatarUrl?: string;
}

export class UserQueryDto {
  @ApiPropertyOptional({
    example: 'username',
    description: 'Filter by username',
  })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiPropertyOptional({
    example: 'eshmat',
    description: 'Filter by pseudoname',
  })
  @IsString()
  @IsOptional()
  pseudoname?: string;

  @ApiPropertyOptional({
    example: 20,
    minimum: 1,
    description: 'Number of comments to return (pagination)',
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({
    example: 0,
    minimum: 0,
    description: 'How many items to skip (pagination offset)',
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
