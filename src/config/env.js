require("dotenv").config();

module.exports = {
  port: process.env.PORT || 50052,
  serverUrl: process.env.SERVER_URL || "0.0.0.0",
  rabbitUrl: process.env.RABBITMQ_URL || "amqp://localhost",
  videoCreatedQueue: process.env.VIDEO_CREATED_QUEUE || "video.created",
  videoUpdatedQueue: process.env.VIDEO_UPDATED_QUEUE || "video.updated",
  videoDeletedQueuePlaylists: process.env.VIDEO_DELETED_QUEUE_PLAYLISTS || "video.deleted.playlists",
};
