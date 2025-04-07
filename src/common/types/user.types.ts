export enum UserRole {
  ADMINISTRATOR = 'ADMINISTRATOR',
  OPERATOR = 'OPERATOR',
  AUDITOR = 'AUDITOR',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  status: UserStatus;
  company_id: string;
  metadata?: Record<string, any>;
} 