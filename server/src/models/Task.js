import mongoose from 'mongoose';

export const PRIORITIES = ['low', 'medium', 'high'];
export const STATUSES = ['in_progress', 'completed'];

const taskSchema = new mongoose.Schema(
  {
    // Anonymous per-device owner id (sent as the X-Client-Id header).
    owner: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    dueAt: { type: Date, required: true },
    priority: { type: String, enum: [...PRIORITIES, null], default: null },
    status: { type: String, enum: STATUSES, default: 'in_progress' },
    completedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.owner;
        return ret;
      },
    },
  },
);

// Week views and searches are always scoped to an owner and ordered by due date.
taskSchema.index({ owner: 1, dueAt: 1 });

export const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);
