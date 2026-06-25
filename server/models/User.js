import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

import { hashToken } from '../utils/crypto.js';

const { Schema, model } = mongoose;

const BCRYPT_ROUNDS = 12;

const notificationPrefsSchema = new Schema(
  {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    taskAssigned: { type: Boolean, default: true },
    taskCompleted: { type: Boolean, default: true },
    comments: { type: Boolean, default: true },
    mentions: { type: Boolean, default: true },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false, // never returned by default
    },
    avatar: {
      type: String, // relative path / URL to the avatar asset
      default: '',
    },
    bio: {
      type: String,
      maxlength: 280,
      default: '',
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    notificationPrefs: {
      type: notificationPrefsSchema,
      default: () => ({}),
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeenAt: {
      type: Date,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },

    // Bumped on logout / password change to invalidate all refresh tokens.
    tokenVersion: {
      type: Number,
      default: 0,
    },

    // Password reset (hashed token + expiry only).
    passwordResetToken: { type: String, select: false, default: null },
    passwordResetExpires: { type: Date, select: false, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.password;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        delete ret.tokenVersion;
        delete ret.__v;
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
    toObject: { virtuals: true },
  },
);

// Hash password whenever it is set/changed.
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, BCRYPT_ROUNDS);
  return next();
});

/** Compares a plaintext candidate against the stored hash. */
userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

/**
 * Generates a password-reset token: stores the hash + expiry on the document
 * and returns the raw token to be emailed. Caller must `save()`.
 *
 * @param {string} rawToken
 * @param {number} ttlMinutes
 */
userSchema.methods.setPasswordResetToken = function setPasswordResetToken(rawToken, ttlMinutes) {
  this.passwordResetToken = hashToken(rawToken);
  this.passwordResetExpires = new Date(Date.now() + ttlMinutes * 60 * 1000);
};

userSchema.methods.clearPasswordReset = function clearPasswordReset() {
  this.passwordResetToken = null;
  this.passwordResetExpires = null;
};

export const User = model('User', userSchema);

export default User;
