import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { UserService } from '../application/user.service';
import { User } from '../domain/entities/user.entity';

@Controller('/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * 사용자 ID로 사용자 정보를 조회합니다.
   * GET /user/:id
   */
  @Get(':id')
  async getUserById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<User | null> {
    return await this.userService.getUserById(id);
  }
}
