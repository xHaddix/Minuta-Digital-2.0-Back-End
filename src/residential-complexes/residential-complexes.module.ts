import { Module } from '@nestjs/common';
import { ResidentialComplexesController } from './residential-complexes.controller';
import { ResidentialComplexesService } from './residential-complexes.service';

@Module({
  controllers: [ResidentialComplexesController],
  providers: [ResidentialComplexesService],
})
export class ResidentialComplexesModule {}
