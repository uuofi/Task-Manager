import mongooseLeanVirtuals from 'mongoose-lean-virtuals';

/**
 * Reusable Mongoose schema plugin that standardizes JSON serialization:
 * exposes `id`, hides `_id`/`__v`, and enables virtuals. Applied to all models
 * so API responses share a consistent shape — including `.lean({ virtuals: true })`
 * reads (via mongoose-lean-virtuals), so list endpoints also return `id`.
 *
 * @param {import('mongoose').Schema} schema
 */
export const toJSONPlugin = (schema) => {
  const transform = (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  };

  schema.set('toJSON', { virtuals: true, transform });
  schema.set('toObject', { virtuals: true, transform });

  // Make `.lean({ virtuals: true })` include virtuals (notably `id`).
  schema.plugin(mongooseLeanVirtuals);
};

export default toJSONPlugin;
