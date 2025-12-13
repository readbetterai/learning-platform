import { Test, TestingModule } from '@nestjs/testing';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';

describe('StudentsController', () => {
  let controller: StudentsController;
  let service: StudentsService;

  const mockStudentsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentsController],
      providers: [
        {
          provide: StudentsService,
          useValue: mockStudentsService,
        },
      ],
    }).compile();

    controller = module.get<StudentsController>(StudentsController);
    service = module.get<StudentsService>(StudentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call service.findAll with query params', async () => {
      const query = { page: 1, limit: 10 };
      const result = { data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } };
      mockStudentsService.findAll.mockResolvedValue(result);

      expect(await controller.findAll(query)).toBe(result);
      expect(mockStudentsService.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with id and user', async () => {
      const user = { userId: 'test-id', email: 'test@test.com', role: 'student' as const };
      const result = { id: 'test-id', email: 'test@test.com' };
      mockStudentsService.findOne.mockResolvedValue(result);

      expect(await controller.findOne('test-id', user)).toBe(result);
      expect(mockStudentsService.findOne).toHaveBeenCalledWith('test-id', user);
    });
  });

  describe('update', () => {
    it('should call service.update with id, dto, and user', async () => {
      const user = { userId: 'test-id', email: 'test@test.com', role: 'student' as const };
      const dto = { firstName: 'Updated' };
      const result = { id: 'test-id', firstName: 'Updated' };
      mockStudentsService.update.mockResolvedValue(result);

      expect(await controller.update('test-id', dto, user)).toBe(result);
      expect(mockStudentsService.update).toHaveBeenCalledWith('test-id', dto, user);
    });
  });

  describe('remove', () => {
    it('should call service.softDelete with id', async () => {
      const result = { message: 'Student deleted successfully' };
      mockStudentsService.softDelete.mockResolvedValue(result);

      expect(await controller.remove('test-id')).toBe(result);
      expect(mockStudentsService.softDelete).toHaveBeenCalledWith('test-id');
    });
  });
});
