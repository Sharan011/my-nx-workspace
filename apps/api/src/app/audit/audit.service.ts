import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(
    action: string,
    entityType: string,
    entityId: string,
    user: User,
    changes?: any,
  ) {
    const auditLog = this.auditLogRepository.create({
      action,
      entityType,
      entityId,
      userId: user.id,
      organizationId: user.organizationId,
      changes: changes ? JSON.stringify(changes) : null,
    });

    await this.auditLogRepository.save(auditLog);
  }

  async getAuditLogs(organizationId: string) {
    return this.auditLogRepository.find({
      where: { organizationId },
      relations: ['user'],
      order: { timestamp: 'DESC' },
      take: 100,
    });
  }

  async getEntityAuditLogs(entityType: string, entityId: string) {
    return this.auditLogRepository.find({
      where: { entityType, entityId },
      relations: ['user'],
      order: { timestamp: 'DESC' },
    });
  }
}