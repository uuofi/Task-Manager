import { Notification } from '../models/Notification.js';

export const notificationRepository = {
  create(data) {
    return Notification.create(data);
  },

  insertMany(docs) {
    return Notification.insertMany(docs);
  },

  async paginate({ recipient, unreadOnly, skip, limit }) {
    const filter = { recipient };
    if (unreadOnly) filter.isRead = false;

    const [items, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort('-createdAt')
        .skip(skip)
        .limit(limit)
        .populate('actor', 'name avatar')
        .lean({ virtuals: true }),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipient, isRead: false }),
    ]);
    return { items, total, unreadCount };
  },

  countUnread(recipient) {
    return Notification.countDocuments({ recipient, isRead: false });
  },

  markRead(id, recipient) {
    return Notification.findOneAndUpdate(
      { _id: id, recipient },
      { isRead: true, readAt: new Date() },
      { new: true },
    );
  },

  markAllRead(recipient) {
    return Notification.updateMany(
      { recipient, isRead: false },
      { isRead: true, readAt: new Date() },
    );
  },

  remove(id, recipient) {
    return Notification.findOneAndDelete({ _id: id, recipient });
  },
};

export default notificationRepository;
