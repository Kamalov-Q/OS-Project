import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, IsNotEmpty } from 'class-validator';

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
    example: 'Johnny',
    description: 'Display name shown publicly',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  pseudoname: string;

  @ApiProperty({
    example: 'strongPassword123',
    description: 'Account password',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

export class LoginDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Username used to log in',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    example: 'strongPassword123',
    description: 'Account password',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
