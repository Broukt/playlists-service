const prisma = require("../database/prisma");
const { connectRabbit } = require("./connection");
const {
  videoCreatedQueue,
  videoUpdatedQueue,
  videoDeletedQueuePlaylists,
} = require("../config/env");

async function consumeVideoEvents() {
  const ch = await connectRabbit();
  await ch.assertQueue(videoCreatedQueue, { durable: true });
  await ch.assertQueue(videoUpdatedQueue, { durable: true });
  await ch.assertQueue(videoDeletedQueuePlaylists, { durable: true });

  ch.consume(videoCreatedQueue, async (msg) => {
    try {
      const data = JSON.parse(msg.content.toString());
      const exists = await prisma.video.findUnique({ where: { id: data.id } });
      if (!exists) {
        await prisma.video.create({ data });
      }
      ch.ack(msg);
    } catch (error) {
      console.error("Error processing video creation:", error);
      ch.nack(msg, false, false);
    }
  });

  ch.consume(videoUpdatedQueue, async (msg) => {
    try {
      const data = JSON.parse(msg.content.toString());
      await prisma.video.update({
        where: { id: data.id },
        data: { ...data },
      });
      ch.ack(msg);
    } catch (error) {
      console.error("Error processing video update:", error);
      ch.nack(msg, false, false);
    }
  });

  ch.consume(videoDeletedQueuePlaylists, async (msg) => {
    try {
      const data = JSON.parse(msg.content.toString());
      await prisma.video.delete({
        where: { id: data.id },
      });
      await prisma.playlistVideo.deleteMany({
        where: { videoId: data.id },
      });
      ch.ack(msg);
    } catch (error) {
      console.error("Error processing video deletion:", error);
      ch.nack(msg, false, false);
    }
  });
}

module.exports = { consumeVideoEvents };
