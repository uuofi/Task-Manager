/**
 * Centralized React Query key factory. Keeps cache keys consistent and makes
 * invalidation predictable across the app.
 */
export const qk = {
  dashboard: ['dashboard'],
  projects: (params) => (params ? ['projects', params] : ['projects']),
  project: (id) => ['project', id],
  board: (projectId) => ['board', projectId],
  tasks: (params) => ['tasks', params],
  task: (id) => ['task', id],
  comments: (taskId) => ['comments', taskId],
  attachments: (taskId) => ['attachments', taskId],
  timer: (taskId) => ['timer', taskId],
  notifications: (params) => ['notifications', params],
  unreadCount: ['notifications', 'unread-count'],
  workspaceMembers: ['workspace', 'members'],
  workspaceCurrent: ['workspace', 'current'],
  invitations: ['invitations'],
  suggestionsReceived: ['suggestions', 'received'],
  suggestionsSent: ['suggestions', 'sent'],
  activity: (params) => ['activity', params],
  search: (q) => ['search', q],
};

export default qk;
