const { Server } = require("@grpc/grpc-js");
const initializeConsumers = require("./rabbitmq/initialize");
const { grpcErrorHandler } = require("./middlewares/grpcErrorHandlerMiddleware");
const loadProto = require("./utils/loadProto");
const playlistService = require("./services/playlistService");

const server = new Server();
const proto = loadProto("playlists");
server.addService(proto.Playlists.service, playlistService);

// Inicializa manejo global de errores y consumidores de RabbitMQ
grpcErrorHandler(server);
initializeConsumers().then(() => console.log("🐇 Consumers ready"));

module.exports = server;
