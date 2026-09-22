import { Test, TestingModule } from '@nestjs/testing';
import { ResidentialComplexesService } from './residential-complexes.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ResidentialComplexesService', () => {
  let service: ResidentialComplexesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResidentialComplexesService,
        {
          provide: PrismaService,
          useValue: {
            residentialComplex: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            organization: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ResidentialComplexesService>(ResidentialComplexesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
