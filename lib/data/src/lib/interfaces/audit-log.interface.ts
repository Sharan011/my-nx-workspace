export interface IAuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  changes: Record<string, any>;
  createdAt: Date;
}
