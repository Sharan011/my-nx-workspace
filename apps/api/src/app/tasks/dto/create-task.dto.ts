import { IsString, IsEnum, IsUUID, IsOptional } from 'class-validator';
import { TaskStatus, TaskPriority } from '../../entities/task.entity';

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @IsUUID()
  @IsOptional()
  assignedToId?: string;
}