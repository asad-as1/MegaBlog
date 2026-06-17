const Notification = require("../models/notification");

const createNotification = async ({ recipient, sender, type, post, comment }) => {
  if (!recipient || !sender || recipient.toString() === sender.toString()) {
    return null;
  }

  return Notification.create({
    recipient,
    sender,
    type,
    post,
    comment,
  });
};

module.exports = { createNotification };
