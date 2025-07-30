import { Server as SocketIOServer, Socket } from "socket.io";

export function setupSocketIO(io: SocketIOServer) {
  io.on("connection", (socket: Socket) => {
    console.log("🔌 Socket conectado:", socket.id);

    socket.on("join", (userId: string) => {
      if (!userId) return;
      socket.join(userId);
      console.log(`✅ Socket ${socket.id} unido a room de usuario ${userId}`);
    });

    socket.on("disconnect", () => {
      console.log("⛔ Socket desconectado:", socket.id);
    });
  });
}
