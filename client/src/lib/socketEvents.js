/** Socket.IO event names — must stay in sync with the server's SOCKET_EVENTS. */
export const SOCKET_EVENTS = Object.freeze({
  USER_ONLINE: 'presence:online',
  USER_OFFLINE: 'presence:offline',
  ONLINE_USERS: 'presence:list',
  JOIN_PROJECT: 'project:join',
  LEAVE_PROJECT: 'project:leave',
  NOTIFICATION_NEW: 'notification:new',
  TASK_CREATED: 'task:created',
  TASK_UPDATED: 'task:updated',
  TASK_DELETED: 'task:deleted',
  COMMENT_CREATED: 'comment:created',
  COMMENT_UPDATED: 'comment:updated',
  COMMENT_DELETED: 'comment:deleted',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
  CONTRACT_LINK_CREATED: 'contract_link:created',
  CONTRACT_LINK_DELETED: 'contract_link:deleted',
  ACTIVITY_NEW: 'activity:new',
  WORKSPACE_MEMBER_JOINED: 'workspace:member_joined',
  WORKSPACE_JOINED: 'workspace:joined',
  PROJECT_MEMBER_ADDED: 'project:member_added',
});

export default SOCKET_EVENTS;
