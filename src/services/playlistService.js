const { catchGrpc } = require("../utils/catchGrpc");
const AppError = require("../utils/appError");
const prisma = require("../database/prisma");
const { status } = require("@grpc/grpc-js");

const CreatePlaylist = catchGrpc(async (call, callback) => {
  const { name, requestorId } = call.request;

  if (!name) {
    return callback(new AppError("The playlists name is required", 400), null);
  }

  const playlist = await prisma.playlist.create({
    data: {
      name,
      userId: requestorId,
    },
  });
  if (!playlist) {
    return callback(new AppError("Failed to create playlist", 500), null);
  }
  callback(null, { status: 200, data: playlist });
});

const AddVideoToPlaylist = catchGrpc(async (call, callback) => {
  const { playlistId, videoId, requestorId } = call.request;

  if (!playlistId || !videoId) {
    return callback(
      new AppError("Playlist ID and Video ID are required", 400),
      null
    );
  }

  const existingPlaylist = await prisma.playlist.findUnique({
    where: { id: playlistId },
  });
  if (!existingPlaylist) {
    return callback(new AppError("Playlist not found", 404), null);
  }
  const existingVideo = await prisma.video.findUnique({
    where: { id: videoId },
  });
  if (!existingVideo) {
    return callback(new AppError("Video not found", 404), null);
  }

  if (existingPlaylist.userId !== requestorId) {
    return callback(
      new AppError("You do not have permission to modify this playlist", 403),
      null
    );
  }

  const existingVideoInPlaylist = await prisma.playlistVideo.findFirst({
    where: {
      playlistId: playlistId,
      videoId: videoId,
    },
  });

  if (existingVideoInPlaylist) {
    return callback(
      new AppError("Video is already in the playlist", 400),
      null
    );
  }
  const addedVideoPlaylist = await prisma.playlistVideo.create({
    data: {
      playlistId: playlistId,
      videoId: videoId,
    },
  });

  if (!addedVideoPlaylist) {
    callback(new AppError("Failed to add video to playlist", 500), null);
  }

  callback(null, { status: 201 });
});

const DeleteVideoFromPlaylist = catchGrpc(async (call, callback) => {
  const { playlistId, videoId, requestorId } = call.request;

  if (!playlistId || !videoId) {
    return callback(
      new AppError("Playlist ID and Video ID are required", 400),
      null
    );
  }

  const existingPlaylist = await prisma.playlist.findUnique({
    where: { id: playlistId },
  });
  if (!existingPlaylist) {
    return callback(new AppError("Playlist not found", 404), null);
  }

  const existingVideo = await prisma.video.findUnique({
    where: { id: videoId },
  });
  if (!existingVideo) {
    return callback(new AppError("Video not found", 404), null);
  }

  if (existingPlaylist.userId !== requestorId) {
    return callback(
      new AppError("You do not have permission to modify this playlist", 403),
      null
    );
  }

  const existingVideoInPlaylist = await prisma.playlistVideo.findFirst({
    where: {
      playlistId: playlistId,
      videoId: videoId,
    },
  });
  if (!existingVideoInPlaylist) {
    return callback(
      new AppError("The video is not in the playlist", 400),
      null
    );
  }

  const deletedVideoPlaylist = await prisma.playlistVideo.delete({
    where: {
      playlistId: playlistId,
      videoId: videoId,
    },
  });

  if (!deletedVideoPlaylist) {
    callback(new AppError("Failed to delete video from playlist", 500), null);
  }

  callback(null, { status: 204 });
});

const GetPlaylists = catchGrpc(async (call, callback) => {
  const playlists = await prisma.playlistVideo.findMany();
  if (!playlists) {
    return callback(new AppError("No playlists found", 404), null);
  }
  return callback(null, { status: 200, data: playlists });
});

const GetPlaylistVideos = catchGrpc(async (call, callback) => {
  const { playlistId } = call.request;

  if (!playlistId) {
    return callback(new AppError("Playlist ID is required", 400), null);
  }

  const playlistVideos = await prisma.playlistVideo.findMany({
    where: { playlistId: playlistId },
    include: { video: true },
  });

  if (!playlistVideos || playlistVideos.length === 0) {
    return callback(
      new AppError("No videos found in this playlist", 404),
      null
    );
  }

  callback(null, { status: 200, data: playlistVideos });
});

const DeletePlaylist = catchGrpc(async (call, callback) => {
  const { playlistId, requestorId } = call.request;

  if (!playlistId) {
    return callback(new AppError("Playlist ID is required", 400), null);
  }

  const existingPlaylist = await prisma.playlist.findUnique({
    where: { id: playlistId },
  });

  if (!existingPlaylist) {
    return callback(new AppError("Playlist not found", 404), null);
  }

  if (existingPlaylist.userId !== requestorId) {
    return callback(
      new AppError("You do not have permission to delete this playlist", 403),
      null
    );
  }

  await prisma.playlist.delete({
    where: { id: playlistId },
  });

  await prisma.playlistVideo.deleteMany({
    where: { playlistId: playlistId },
  });

  callback(null, { status: 204 });
});

module.exports = {
  CreatePlaylist,
  AddVideoToPlaylist,
  DeleteVideoFromPlaylist,
  GetPlaylists,
  GetPlaylistVideos,
  DeletePlaylist,
};
