import { PartialType } from '@nestjs/mapped-types';
import { CreateCommentDto } from './create-comment.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength, IsOptional } from 'class-validator';

export class UpdateCommentDto extends PartialType(CreateCommentDto) {
  @ApiPropertyOptional({
    example: 'Updated comment',
    description: 'Updated content of the comment',
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  content?: string;
}
