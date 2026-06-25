import { TaskSuggestion } from '../models/TaskSuggestion.js';

const POPULATE = [
  { path: 'suggestedBy', select: 'name avatar email' },
  { path: 'suggestedTo', select: 'name avatar email' },
  { path: 'project', select: 'name key color' },
  { path: 'resultingTask', select: 'title key status' },
];

export const suggestionRepository = {
  create(data) {
    return TaskSuggestion.create(data);
  },

  findById(id) {
    return TaskSuggestion.findById(id);
  },

  findByIdPopulated(id) {
    return TaskSuggestion.findById(id).populate(POPULATE);
  },

  async paginate({ workspace, suggestedTo, suggestedBy, status, skip, limit }) {
    const filter = { workspace };
    if (suggestedTo) filter.suggestedTo = suggestedTo;
    if (suggestedBy) filter.suggestedBy = suggestedBy;
    if (status) filter.status = status;

    const [items, total] = await Promise.all([
      TaskSuggestion.find(filter).sort('-createdAt').skip(skip).limit(limit).populate(POPULATE).lean({ virtuals: true }),
      TaskSuggestion.countDocuments(filter),
    ]);
    return { items, total };
  },
};

export default suggestionRepository;
