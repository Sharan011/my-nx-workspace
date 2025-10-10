import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Organization } from './organization.entity';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ORG_ADMIN = 'org_admin',
  MANAGER = 'manager',
  MEMBER = 'member',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({
    type: 'varchar',
    enum: UserRole,
    default: UserRole.MEMBER,
  })
  role: UserRole;

  @Column('uuid')
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
