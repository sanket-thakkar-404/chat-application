import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { Server } from "socket.io";
import config from "./src/config/dotenv.config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = config.PORT;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: true, methods: ["GET", "POST"], credentials: true },
});

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (_req, res) => res.render("index", { title: "Circle Chat API" }));
app.get("/health", (_req, res) => res.json({ ok: true, rooms: rooms.size }));

// In-memory room state. Swap this for Redis when running multiple server instances.
const rooms = new Map();
const users = new Map();
const MAX_RANDOM_MEMBERS = 8;

const makeId = (prefix = "ROOM") =>
  `${prefix}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

const publicMember = (socketId) => {
  const user = users.get(socketId);
  return user ? { socketId, name: user.name, initials: user.initials, color: user.color } : null;
};

const roomPayload = (room) => ({
  id: room.id,
  name: room.name,
  private: room.private,
  key: room.private ? room.key : "",
  members: [...room.members].map(publicMember).filter(Boolean),
});

const broadcastMembers = (room) => io.to(room.id).emit("room-members", roomPayload(room).members);

const leaveCurrentRoom = (socket) => {
  const user = users.get(socket.id);
  if (!user?.roomId) return;
  const room = rooms.get(user.roomId);
  socket.leave(user.roomId);
  user.roomId = null;
  if (!room) return;
  room.members.delete(socket.id);
  if (room.members.size === 0) rooms.delete(room.id);
  else broadcastMembers(room);
};

const joinRoom = (socket, room, ack) => {
  leaveCurrentRoom(socket);
  room.members.add(socket.id);
  users.get(socket.id).roomId = room.id;
  socket.join(room.id);
  const payload = roomPayload(room);
  ack?.({ ok: true, room: payload });
  broadcastMembers(room);
  socket.to(room.id).emit("system-message", `${users.get(socket.id).name} joined the circle`);
};

io.on("connection", (socket) => {
  socket.on("register-user", ({ name } = {}, ack) => {
    const cleanName = String(name || "Guest").trim().slice(0, 30) || "Guest";
    const colors = ["#ee8c70", "#5c91d7", "#d65e8c", "#3aa989", "#6957d9"];
    users.set(socket.id, {
      name: cleanName,
      initials: cleanName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
      color: colors[Math.floor(Math.random() * colors.length)],
      roomId: null,
    });
    ack?.({ ok: true, socketId: socket.id });
  });

  socket.on("join-random-room", (_payload, ack) => {
    if (!users.has(socket.id)) return ack?.({ ok: false, error: "Register first" });
    let room = [...rooms.values()].find((item) => !item.private && item.members.size < MAX_RANDOM_MEMBERS);
    if (!room) {
      const id = makeId();
      room = { id, name: "The Commons", private: false, key: "", members: new Set() };
      rooms.set(id, room);
    }
    joinRoom(socket, room, ack);
  });

  socket.on("create-random-room", (_payload, ack) => {
    if (!users.has(socket.id)) return ack?.({ ok: false, error: "Register first" });
    const id = makeId();
    const room = { id, name: "New Explorers", private: false, key: "", members: new Set() };
    rooms.set(id, room);
    joinRoom(socket, room, ack);
  });

  socket.on("create-private-room", (_payload, ack) => {
    if (!users.has(socket.id)) return ack?.({ ok: false, error: "Register first" });
    let key;
    do key = makeId("CIRCLE"); while ([...rooms.values()].some((room) => room.key === key));
    const id = makeId("PRIVATE");
    const room = { id, name: "Private Circle", private: true, key, members: new Set() };
    rooms.set(id, room);
    joinRoom(socket, room, ack);
  });

  socket.on("join-private-room", ({ key } = {}, ack) => {
    if (!users.has(socket.id)) return ack?.({ ok: false, error: "Register first" });
    const normalized = String(key || "").trim().toUpperCase();
    const room = [...rooms.values()].find((item) => item.private && item.key === normalized);
    if (!room) return ack?.({ ok: false, error: "Private key is invalid or the room has closed" });
    joinRoom(socket, room, ack);
  });

  socket.on("send-room-message", ({ text } = {}, ack) => {
    const user = users.get(socket.id);
    const room = user && rooms.get(user.roomId);
    const cleanText = String(text || "").trim().slice(0, 2000);
    if (!room || !cleanText) return ack?.({ ok: false, error: "Unable to send message" });
    const message = {
      id: `${Date.now()}-${socket.id}`,
      senderId: socket.id,
      sender: user.name,
      initials: user.initials,
      color: user.color,
      text: cleanText,
      time: new Date().toISOString(),
    };
    io.to(room.id).emit("room-message", message);
    ack?.({ ok: true });
  });

  socket.on("send-direct-message", ({ to, text } = {}, ack) => {
    const user = users.get(socket.id);
    const target = users.get(to);
    const cleanText = String(text || "").trim().slice(0, 2000);
    if (!user || !target || !cleanText) return ack?.({ ok: false, error: "User is no longer online" });
    const message = {
      id: `${Date.now()}-${socket.id}`,
      senderId: socket.id,
      sender: user.name,
      to,
      text: cleanText,
      time: new Date().toISOString(),
    };
    io.to(socket.id).to(to).emit("direct-message", message);
    ack?.({ ok: true });
  });

  socket.on("typing", ({ type, to, isTyping } = {}) => {
    const user = users.get(socket.id);
    if (!user) return;
    const payload = { socketId: socket.id, name: user.name, type: type === "direct" ? "direct" : "group", isTyping: Boolean(isTyping) };
    if (payload.type === "direct") {
      if (to && users.has(to)) io.to(to).emit("typing-status", payload);
      return;
    }
    const room = rooms.get(user.roomId);
    if (room) socket.to(room.id).emit("typing-status", payload);
  });

  socket.on("leave-room", () => leaveCurrentRoom(socket));
  socket.on("disconnect", () => {
    leaveCurrentRoom(socket);
    users.delete(socket.id);
  });
});

app.use("*name", (req, res) => {
  res.sendFile(path(__dirname, "../public/index.html"))
})

server.listen(PORT, () => console.log(`Circle server running on http://localhost:${PORT}`));

export default app;
