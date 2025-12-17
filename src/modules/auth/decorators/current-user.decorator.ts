import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserDto {
  userId: string;
}

export const CurrentUser = createParamDecorator<CurrentUserDto>(
  (_data: unknown, ctx: ExecutionContext): CurrentUserDto | null => {
    const request = ctx.switchToHttp().getRequest();
    return request.user ?? null;
  },
);
