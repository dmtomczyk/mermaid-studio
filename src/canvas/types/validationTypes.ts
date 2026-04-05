export type ValidationLevel = 'info' | 'warning' | 'error';

export interface ValidationIssue {
  level: ValidationLevel;
  message: string;
  targetId?: string;
  path?: string;
}
