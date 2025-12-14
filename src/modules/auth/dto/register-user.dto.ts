import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'john doe',
    description: 'Unique username of the user',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  username: string;

  @ApiProperty({
    example: 'strongPassword123',
    description: 'Account password',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
