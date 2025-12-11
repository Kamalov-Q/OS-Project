import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class PostQueryDto {
  @ApiPropertyOptional({
    description: 'Search by content, username, or pseudoname',
    example: 'hello',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Number of items to return',
    example: 20,
  })
  @Transform(({ value }) => (value ? Number(value) : 20))
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit: number = 20;

  @ApiPropertyOptional({
    description: 'Number of items to skip',
    example: 0,
  })
  @Transform(({ value }) => (value ? Number(value) : 0))
  @IsOptional()
  @IsNumber()
  @Min(0)
  offset: number = 0;
}
