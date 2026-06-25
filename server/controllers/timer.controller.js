import { timerService } from '../services/timer.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const startTimer = asyncHandler(async (req, res) => {
  const entry = await timerService.start({ task: req.task, user: req.user });
  return ApiResponse.created(res, entry, 'Timer started');
});

export const pauseTimer = asyncHandler(async (req, res) => {
  const entry = await timerService.pause({ task: req.task, user: req.user });
  return ApiResponse.ok(res, entry, 'Timer paused');
});

export const resumeTimer = asyncHandler(async (req, res) => {
  const entry = await timerService.resume({ task: req.task, user: req.user });
  return ApiResponse.ok(res, entry, 'Timer resumed');
});

export const stopTimer = asyncHandler(async (req, res) => {
  const entry = await timerService.stop({ task: req.task, user: req.user });
  return ApiResponse.ok(res, entry, 'Timer stopped');
});

export const getActiveTimer = asyncHandler(async (req, res) => {
  const entry = await timerService.getActive({ task: req.task, user: req.user });
  return ApiResponse.ok(res, entry, 'Active timer');
});

export const listTaskTime = asyncHandler(async (req, res) => {
  const entries = await timerService.listForTask(req.task.id);
  return ApiResponse.ok(res, entries, 'Time entries loaded');
});
