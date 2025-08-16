// src/socket/socket.ts
import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer;

export const initSocket = (server: any) => {
  io = new SocketIOServer(server, {
    cors: { origin: "*" }, // ajustá según tus necesidades
  });
  return io;
};

export const getIo = () => {
  if (!io) {
    throw new Error("❌ Socket.IO no inicializado");
  }
  return io;
}; 
