import { userRepository } from '../repositories/user.repository.js';
import { ApiError } from '../utils/ApiError.js';

import { storageService } from './storage.service.js';

const updateProfile = async ({ user, data }) => {
  const fields = ['name', 'bio', 'timezone'];
  fields.forEach((f) => {
    if (data[f] !== undefined) user[f] = data[f];
  });
  if (data.notificationPrefs) {
    user.notificationPrefs = { ...user.notificationPrefs.toObject(), ...data.notificationPrefs };
  }
  await user.save();
  return user;
};

const changePassword = async ({ userId, currentPassword, newPassword }) => {
  const user = await userRepository.findByIdWithPassword(userId);
  if (!user) throw ApiError.notFound('User not found');

  const matches = await user.comparePassword(currentPassword);
  if (!matches) throw ApiError.unauthorized('Current password is incorrect');

  user.password = newPassword;
  user.tokenVersion += 1; // invalidate other sessions
  await user.save();
  return { changed: true };
};

/** Stores a new avatar, removes the previous local file, returns the user. */
const updateAvatar = async ({ user, file }) => {
  if (!file) throw ApiError.badRequest('No image file provided');
  if (!file.mimetype.startsWith('image/')) {
    throw ApiError.badRequest('Avatar must be an image');
  }

  const previous = user.avatar;
  const saved = await storageService.save(file);
  user.avatar = saved.url;
  await user.save();

  // Best-effort cleanup of the old local avatar.
  if (previous && previous.startsWith('/uploads/')) {
    await storageService.remove(previous.replace('/uploads/', ''));
  }
  return user;
};

export const userService = { updateProfile, changePassword, updateAvatar };

export default userService;
