/**
 * Application-wide constants and enumerations.
 * Centralizing these prevents magic strings scattered across the codebase.
 */

/** Workspace / project roles, ordered from most to least privileged. */
export const ROLES = Object.freeze({
  OWNER: 'owner',
  ADMIN: 'admin',
  MANAGER: 'manager',
  MEMBER: 'member',
});

export const ROLE_VALUES = Object.freeze(Object.values(ROLES));

/**
 * Role hierarchy weight. Higher number = more privilege.
 * Used by RBAC middleware to allow "at least this role" checks.
 */
export const ROLE_RANK = Object.freeze({
  [ROLES.MEMBER]: 1,
  [ROLES.MANAGER]: 2,
  [ROLES.ADMIN]: 3,
  [ROLES.OWNER]: 4,
});

/** Task lifecycle states. */
export const TASK_STATUS = Object.freeze({
  BACKLOG: 'backlog',
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  REVIEW: 'review',
  DONE: 'done',
  CANCELLED: 'cancelled',
});

export const TASK_STATUS_VALUES = Object.freeze(Object.values(TASK_STATUS));

/** Task priorities. */
export const TASK_PRIORITY = Object.freeze({
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
});

export const TASK_PRIORITY_VALUES = Object.freeze(Object.values(TASK_PRIORITY));

/** Project lifecycle states. */
export const PROJECT_STATUS = Object.freeze({
  ACTIVE: 'active',
  ARCHIVED: 'archived',
});

export const PROJECT_STATUS_VALUES = Object.freeze(Object.values(PROJECT_STATUS));

/** Task suggestion workflow states. */
export const SUGGESTION_STATUS = Object.freeze({
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
});

export const SUGGESTION_STATUS_VALUES = Object.freeze(Object.values(SUGGESTION_STATUS));

/** Invitation workflow states. */
export const INVITATION_STATUS = Object.freeze({
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  EXPIRED: 'expired',
});

export const INVITATION_STATUS_VALUES = Object.freeze(Object.values(INVITATION_STATUS));

/** Time entry states (for the task timer). */
export const TIMER_STATUS = Object.freeze({
  RUNNING: 'running',
  PAUSED: 'paused',
  STOPPED: 'stopped',
});

export const TIMER_STATUS_VALUES = Object.freeze(Object.values(TIMER_STATUS));

/** Notification types. */
export const NOTIFICATION_TYPE = Object.freeze({
  TASK_ASSIGNED: 'task_assigned',
  TASK_COMPLETED: 'task_completed',
  TASK_OVERDUE: 'task_overdue',
  COMMENT_ADDED: 'comment_added',
  MENTION: 'mention',
  TASK_SUGGESTION: 'task_suggestion',
  PROJECT_INVITATION: 'project_invitation',
  WORKSPACE_INVITATION: 'workspace_invitation',
});

export const NOTIFICATION_TYPE_VALUES = Object.freeze(Object.values(NOTIFICATION_TYPE));

/** Activity log action verbs. */
export const ACTIVITY_ACTION = Object.freeze({
  CREATED: 'created',
  UPDATED: 'updated',
  DELETED: 'deleted',
  ARCHIVED: 'archived',
  RESTORED: 'restored',
  ASSIGNED: 'assigned',
  STATUS_CHANGED: 'status_changed',
  COMMENTED: 'commented',
  INVITED: 'invited',
  JOINED: 'joined',
  LEFT: 'left',
});

/** Entity types referenced by activity logs / notifications. */
export const ENTITY_TYPE = Object.freeze({
  PROJECT: 'project',
  TASK: 'task',
  COMMENT: 'comment',
  USER: 'user',
  WORKSPACE: 'workspace',
  INVITATION: 'invitation',
});

/** Recurring task cadence. */
export const RECURRENCE = Object.freeze({
  NONE: 'none',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
});

export const RECURRENCE_VALUES = Object.freeze(Object.values(RECURRENCE));

/** HTTP status codes used across the API. */
export const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
});

/** Socket.IO event names (shared contract with the client). */
export const SOCKET_EVENTS = Object.freeze({
  // connection lifecycle
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  // presence
  USER_ONLINE: 'presence:online',
  USER_OFFLINE: 'presence:offline',
  ONLINE_USERS: 'presence:list',
  // rooms
  JOIN_PROJECT: 'project:join',
  LEAVE_PROJECT: 'project:leave',
  // notifications
  NOTIFICATION_NEW: 'notification:new',
  // workspace membership
  WORKSPACE_MEMBER_JOINED: 'workspace:member_joined',
  WORKSPACE_JOINED: 'workspace:joined',
  // tasks
  TASK_CREATED: 'task:created',
  TASK_UPDATED: 'task:updated',
  TASK_DELETED: 'task:deleted',
  // comments
  COMMENT_CREATED: 'comment:created',
  COMMENT_UPDATED: 'comment:updated',
  COMMENT_DELETED: 'comment:deleted',
  // typing indicator
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
});

export const COOKIE_NAMES = Object.freeze({
  REFRESH_TOKEN: 'tc_refresh_token',
});
