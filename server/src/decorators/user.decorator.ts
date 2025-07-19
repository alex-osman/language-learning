import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const UserID = createParamDecorator((data, ctx: ExecutionContext) => {
  return 2;
});
