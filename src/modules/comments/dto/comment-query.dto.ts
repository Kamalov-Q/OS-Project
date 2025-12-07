import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CommentQueryDto {
  @ApiPropertyOptional({
    example: 'abc123-post-id',
    description: 'Filter comments by Post ID',
  })
  @IsOptional()
  @IsString()
  postId?: string;

  @ApiPropertyOptional({
    example: 'user123',
    description: 'Filter comments by User ID',
  })
  @IsOptional()
  @IsString()
  userId?: string;

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
