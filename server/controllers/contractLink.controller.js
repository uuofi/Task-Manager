import { contractLinkService } from '../services/contractLink.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listContractLinks = asyncHandler(async (req, res) => {
  const links = await contractLinkService.list(req.workspace);
  return ApiResponse.ok(res, links, 'Contract links loaded');
});

export const toggleContractLink = asyncHandler(async (req, res) => {
  const result = await contractLinkService.toggle({
    workspace: req.workspace,
    user: req.user,
    projectA: req.body.projectA,
    projectB: req.body.projectB,
  });
  return ApiResponse.ok(res, result, 'Contract link updated');
});

export const removeContractLink = asyncHandler(async (req, res) => {
  const result = await contractLinkService.remove({
    workspace: req.workspace,
    id: req.params.id,
  });
  return ApiResponse.ok(res, result, 'Contract link removed');
});
