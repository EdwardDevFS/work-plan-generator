export type RoleLevel = 'ADMIN' | 'COORDINATOR' | 'SUPERVISOR' | 'WORKER';

export type WorkPlanStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

export type ActivityStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'DONE_WARN' | 'BLOCKED';

export type SubactivityStatus = 'PENDING' | 'DONE' | 'WARN' | 'SKIPPED';

export type NotificationType = 'TIME_EXCEEDED' | 'OUT_OF_ORDER' | 'STEP_SKIPPED' | 'BLOCKED';

export type AssignmentType = 'COORDINATOR' | 'SUPERVISOR';