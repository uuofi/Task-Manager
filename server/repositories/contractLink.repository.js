import { ContractLink } from '../models/ContractLink.js';

export const contractLinkRepository = {
  listByWorkspace(workspace) {
    return ContractLink.find({ workspace }).sort('-createdAt').lean({ virtuals: true });
  },

  findPair(workspace, a, b) {
    return ContractLink.findOne({ workspace, a, b });
  },

  create(data) {
    return ContractLink.create(data);
  },

  deletePair(workspace, a, b) {
    return ContractLink.findOneAndDelete({ workspace, a, b });
  },

  deleteById(workspace, id) {
    return ContractLink.findOneAndDelete({ _id: id, workspace });
  },
};

export default contractLinkRepository;
