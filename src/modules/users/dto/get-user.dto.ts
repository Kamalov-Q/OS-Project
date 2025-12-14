import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

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
