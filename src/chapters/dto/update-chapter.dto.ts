import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateChapterDto } from './create-chapter.dto';

// Cannot update contentId - chapter belongs to one content
export class UpdateChapterDto extends PartialType(
  OmitType(CreateChapterDto, ['contentId'] as const),
) {}
