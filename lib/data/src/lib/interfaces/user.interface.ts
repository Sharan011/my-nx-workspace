export enum UserRole {
  OWNER = 'owner',
  ORG_ADMIN = 'org_admin',
  MEMBER = 'member',
}

export interface IUser {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}
