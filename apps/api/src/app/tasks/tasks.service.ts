import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';
import { User, UserRole } from '../entities/user.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private auditService: AuditService,
  ) {}

  async create(createTaskDto: CreateTaskDto, user: User) {
    // Verify assigned user belongs to same organization
    if (createTaskDto.assignedToId) {
      const assignedUser = await this.userRepository.findOne({
        where: { id: createTaskDto.assignedToId },
      });

      if (!assignedUser || assignedUser.organizationId !== user.organizationId) {
        throw new ForbiddenException('Cannot assign task to user from different organization');
      }
    }

    const task = this.taskRepository.create({
      ...createTaskDto,
      createdById: user.id,
      organizationId: user.organizationId,
    });

    const savedTask = await this.taskRepository.save(task);

    // Log audit
    await this.auditService.log('CREATE', 'Task', savedTask.id, user, {
      title: savedTask.title,
      assignedToId: savedTask.assignedToId,
    });

    return this.taskRepository.findOne({
      where: { id: savedTask.id },
      relations: ['assignedTo', 'createdBy'],
    });
  }

  async findAll(user: User) {
    const query = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.assignedTo', 'assignedTo')
      .leftJoinAndSelect('task.createdBy', 'createdBy')
      .where('task.organizationId = :organizationId', { organizationId: user.organizationId });

    // RBAC: Members can only see their own tasks
    if (user.role === UserRole.MEMBER) {
      query.andWhere('(task.assignedToId = :userId OR task.createdById = :userId)', {
        userId: user.id,
      });
    }

    return query.orderBy('task.createdAt', 'DESC').getMany();
  }

  async findOne(id: string, user: User) {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['assignedTo', 'createdBy', 'organization'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // RBAC: Check organization
    if (task.organizationId !== user.organizationId) {
      throw new ForbiddenException('Access denied');
    }

    // RBAC: Members can only see their own tasks
    if (user.role === UserRole.MEMBER) {
      if (task.assignedToId !== user.id && task.createdById !== user.id) {
        throw new ForbiddenException('Access denied');
      }
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, user: User) {
    const task = await this.findOne(id, user);

    // RBAC: Members can only update status of their assigned tasks
    if (user.role === UserRole.MEMBER) {
      if (task.assignedToId !== user.id) {
        throw new ForbiddenException('You can only update your assigned tasks');
      }
      // Members can only update status
      if (Object.keys(updateTaskDto).some((key) => key !== 'status')) {
        throw new ForbiddenException('You can only update task status');
      }
    }

    // Verify assigned user if changing assignment
    if (updateTaskDto.assignedToId) {
      const assignedUser = await this.userRepository.findOne({
        where: { id: updateTaskDto.assignedToId },
      });

      if (!assignedUser || assignedUser.organizationId !== user.organizationId) {
        throw new ForbiddenException('Cannot assign task to user from different organization');
      }
    }

    const oldValues = { ...task };
    Object.assign(task, updateTaskDto);
    const updatedTask = await this.taskRepository.save(task);

    // Log audit
    await this.auditService.log('UPDATE', 'Task', updatedTask.id, user, {
      old: oldValues,
      new: updateTaskDto,
    });

    return this.taskRepository.findOne({
      where: { id: updatedTask.id },
      relations: ['assignedTo', 'createdBy'],
    });
  }

  async remove(id: string, user: User) {
    const task = await this.findOne(id, user);

    // RBAC: Only admins and managers can delete tasks
    if (user.role === UserRole.MEMBER) {
      throw new ForbiddenException('You do not have permission to delete tasks');
    }

    await this.taskRepository.remove(task);

    // Log audit
    await this.auditService.log('DELETE', 'Task', id, user, {
      title: task.title,
    });

    return { message: 'Task deleted successfully' };
  }
}