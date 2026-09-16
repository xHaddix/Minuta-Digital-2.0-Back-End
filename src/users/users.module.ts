import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserHierarchyService } from './user-hierarchy.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UserHierarchyService],
  exports: [UsersService, UserHierarchyService],
})
export class UsersModule {}
