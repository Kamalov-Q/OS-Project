import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, MinLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    example: '42',
    description: 'ID of the post to comment on',
  })
  @Type(() => String)
  @IsString()
  @IsNotEmpty({ message: 'Post ID is required' })
  postId: string;

  @ApiProperty({
    example: 'This is an awesome post!',
    description: 'Content of the comment',
    minLength: 1,
  })
  @IsNotEmpty({ message: 'Comment content is required' })
  @IsString()
  @MinLength(1, { message: 'Comment must be at least 1 character long' })
  content: string;
}
