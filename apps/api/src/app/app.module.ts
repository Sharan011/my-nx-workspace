import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { User } from './entities/user.entity';
import { Organization } from './entities/organization.entity';
import { Task } from './entities/task.entity';
import { AuditLog } from './entities/audit-log.entity';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'taskmanagement',
      entities: [User, Organization, Task, AuditLog],
      synchronize: true,
      logging: true,
    }),
    AuthModule,
    TasksModule, // ADD THIS
    AuditModule, // ADD THIS
  ],
})
export class AppModule {}