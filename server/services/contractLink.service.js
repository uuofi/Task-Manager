import { SOCKET_EVENTS } from '../constants/index.js';
import { Project } from '../models/Project.js';
import { contractLinkRepository } from '../repositories/contractLink.repository.js';
import { realtime } from '../sockets/emitter.js';
import { ApiError } from '../utils/ApiError.js';

/** Stable ordering for an unordered pair so a link is stored only once. */
const orderPair = (x, y) => (String(x) < String(y) ? [x, y] : [y, x]);

/** Shapes a link doc/lean object into the client contract: { id, a, b }. */
const toDto = (link) => ({
  id: String(link.id ?? link._id),
  a: String(link.a),
  b: String(link.b),
});

const list = async (workspace) => {
  const links = await contractLinkRepository.listByWorkspace(workspace.id);
  return links.map(toDto);
};

/** Asserts both projects exist within the workspace and are distinct. */
const assertProjects = async (workspaceId, projectA, projectB) => {
  if (String(projectA) === String(projectB)) {
    throw ApiError.badRequest('Cannot link a project to itself');
  }
  const count = await Project.countDocuments({
    _id: { $in: [projectA, projectB] },
    workspace: workspaceId,
  });
  if (count !== 2) {
    throw ApiError.badRequest('Both projects must belong to this workspace');
  }
};

/**
 * Toggles a link between two projects: creates it if absent, removes it if it
 * already exists. Emits a realtime event so every connected teammate's map
 * stays in sync.
 */
const toggle = async ({ workspace, user, projectA, projectB }) => {
  await assertProjects(workspace.id, projectA, projectB);
  const [a, b] = orderPair(projectA, projectB);

  const existing = await contractLinkRepository.findPair(workspace.id, a, b);
  if (existing) {
    await contractLinkRepository.deletePair(workspace.id, a, b);
    realtime.emitToWorkspace(String(workspace.id), SOCKET_EVENTS.CONTRACT_LINK_DELETED, {
      id: String(existing.id),
      a: String(a),
      b: String(b),
    });
    return { action: 'removed', link: toDto(existing) };
  }

  const created = await contractLinkRepository.create({
    workspace: workspace.id,
    a,
    b,
    createdBy: user.id,
  });
  const dto = toDto(created);
  realtime.emitToWorkspace(String(workspace.id), SOCKET_EVENTS.CONTRACT_LINK_CREATED, dto);
  return { action: 'created', link: dto };
};

const remove = async ({ workspace, id }) => {
  const deleted = await contractLinkRepository.deleteById(workspace.id, id);
  if (!deleted) throw ApiError.notFound('Link not found');
  realtime.emitToWorkspace(String(workspace.id), SOCKET_EVENTS.CONTRACT_LINK_DELETED, {
    id: String(deleted.id),
    a: String(deleted.a),
    b: String(deleted.b),
  });
  return { id: String(deleted.id) };
};

export const contractLinkService = { list, toggle, remove };

export default contractLinkService;
