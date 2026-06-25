import { User } from '../models/User.js';

/**
 * Data-access layer for users. Keeps Mongoose query details out of services so
 * the persistence mechanism can change without touching business logic.
 */
export const userRepository = {
  create(data) {
    return User.create(data);
  },

  findById(id) {
    return User.findById(id);
  },

  findByEmail(email) {
    return User.findOne({ email: email.toLowerCase() });
  },

  /** Includes the password hash (normally `select: false`). */
  findByEmailWithPassword(email) {
    return User.findOne({ email: email.toLowerCase() }).select('+password');
  },

  findByIdWithPassword(id) {
    return User.findById(id).select('+password');
  },

  existsByEmail(email) {
    return User.exists({ email: email.toLowerCase() });
  },

  /** Looks up a user by a hashed, unexpired password-reset token. */
  findByResetTokenHash(tokenHash) {
    return User.findOne({
      passwordResetToken: tokenHash,
      passwordResetExpires: { $gt: new Date() },
    }).select('+password +passwordResetToken +passwordResetExpires');
  },

  updateById(id, update) {
    return User.findByIdAndUpdate(id, update, { new: true, runValidators: true });
  },

  setOnlineStatus(id, isOnline) {
    return User.findByIdAndUpdate(id, {
      isOnline,
      lastSeenAt: new Date(),
    });
  },
};

export default userRepository;
