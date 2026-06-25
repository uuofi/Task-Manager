import mongoose from 'mongoose';

import { toJSONPlugin } from '../utils/mongoose.js';

const { Schema, model } = mongoose;

const attachmentSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },

    // An attachment belongs to a task and/or a comment.
    task: { type: Schema.Types.ObjectId, ref: 'Task', default: null, index: true },
    comment: { type: Schema.Types.ObjectId, ref: 'Comment', default: null },

    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    originalName: { type: String, required: true },
    storedName: { type: String, required: true }, // disambiguated name on disk/bucket
    mimeType: { type: String, required: true },
    size: { type: Number, required: true }, // bytes

    // Public URL/path used by clients; resolved by the storage service.
    url: { type: String, required: true },

    // Which storage backend holds the file (local | cloudinary | s3).
    storageDriver: { type: String, default: 'local' },
  },
  { timestamps: true },
);

attachmentSchema.virtual('isImage').get(function isImage() {
  return typeof this.mimeType === 'string' && this.mimeType.startsWith('image/');
});

attachmentSchema.plugin(toJSONPlugin);

export const Attachment = model('Attachment', attachmentSchema);

export default Attachment;
