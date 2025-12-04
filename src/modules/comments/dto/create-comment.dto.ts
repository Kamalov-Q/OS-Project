import { IsNotEmpty, IsNumber, IsString, MinLength } from 'class-validator';

export class CreateCommentDto {
  @IsNumber()
  @IsNotEmpty({ message: 'Post ID is required' })
  postId: string;

  @IsNotEmpty({ message: 'Comment content is required' })
  @IsString()
  @MinLength(1, { message: 'Comment must be at least 1 character long' })
  content: string;
}
