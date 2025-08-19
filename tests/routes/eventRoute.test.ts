// tests/routes/eventRoute.test.ts

jest.mock("../../src/sockets/forEventRequest/eventEmmiters", () => ({ emitToAll: jest.fn() }));
const mockAuth = jest.fn();
jest.mock("../../src/auth/middlewares/authMiddleware", () => ({
  authMiddleware: (req: any, res: any, next: any) => mockAuth(req, res, next),
}));
jest.mock("../../src/auth/middlewares/rateLimiters", () => ({
  limitCreateUser: (_req: any, _res: any, next: any) => next(),
  limitEventRequestsSent: (_req: any, _res: any, next: any) => next(),
  loginRateLimiter: (_req: any, _res: any, next: any) => next(),
  limitPostEventRequest: (_req: any, _res: any, next: any) => next(), // ← falta este
  limitPatchEventRequest: (_req: any, _res: any, next: any) => next(), // ← y este si usás PATCH
}));



import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../../src/app";
import { UserModel } from "../../src/models/UserModel";
import { EventModel } from "../../src/models/EventsModel";
import { generateTokens } from "../../src/utils/generateTokens";
import { Server as SocketIOServer } from "socket.io";
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}


describe("Event Routes", () => {
  let mongoServer: MongoMemoryServer;
  let userId: mongoose.Types.ObjectId;
  let otherUserId: mongoose.Types.ObjectId;
  let accessToken: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.disconnect();
    await mongoose.connect(uri);
    // mock de socket.io para que no explote
    const fakeIo = { emit: jest.fn() } as unknown as SocketIOServer;
    app.set("io", fakeIo);
  });

  beforeEach(async () => {
     jest.clearAllMocks();
  mockAuth.mockImplementation((req, _res, next) => {
    req.userId = userId;
    next();
  });
    await UserModel.deleteMany({});
    await EventModel.deleteMany({});
    const user = await UserModel.create({
      googleId: "test-google-id",
      name: "Test",
      surname: "User",
      identify: "123456",
      age: 30,
      email: "testuser@example.com",
      password: "hashedpassword",
      photos: [],
      eventRequestsSent: [],
    });
    userId = user._id;

    const otherUser = await UserModel.create({
      googleId: "other-google-id",
      name: "Other",
      surname: "User",
      identify: "654321",
      age: 28,
      email: "other@example.com",
      password: "hashedpassword",
      photos: [],
      eventRequestsSent: [],
    });
    otherUserId = otherUser._id;

    const tokens = await generateTokens(
      userId.toString(),
      "testuser@example.com",
      "test-agent",
      "127.0.0.1",
      "test-device"
    );
    accessToken = tokens.accessToken;
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe("Event Routes", () => {
    it("POST /api/events → debería crear un evento", async () => {
      mockAuth.mockImplementation((req, _res, next) => {
        req.userId = userId;
        next();
      });

      const res = await request(app)
        .post("/api/events").set("Authorization", `Bearer ${accessToken}`) 
        .send({
          titleEvent: "Test Event",
          publicDescription: "desc",
          privateDescription: "priv",
          date: "2025-08-21",
          location: "Loc",
          isSolidary: true,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");

      const event = await EventModel.findById(res.body.id);
      expect(event).not.toBeNull();
      expect(event?.titleEvent).toBe("Test Event");
    });
  });

  it("POST /api/events → debería rechazar si falta un campo requerido", async () => {
    mockAuth.mockImplementation((req, _res, next) => {
      req.userId = userId; // usuario válido
      next();
    });

    const res = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        // Falta titleEvent
        publicDescription: "desc",
        privateDescription: "priv",
        date: "2025-08-20",
        location: "Loc",
      });

    expect(res.status).toBe(400);
    expect(res.body.issues[0].path).toBe("titleEvent");
  });

  it("POST /api/events → debería rechazar si no hay token", async () => {
    mockAuth.mockImplementation((_req, res, _next) => {
      return res.status(401).json({ error: "No autorizado" });
    });

    const res = await request(app).post("/api/events").send({
      titleEvent: "No Auth Event",
      publicDescription: "desc",
      privateDescription: "priv",
      date: "2025-08-20",
      location: "Loc",
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/No autorizado/);
  });

  // --- GET ---
  it("GET /api/events → debería devolver lista de eventos", async () => {
    mockAuth.mockImplementation((req, _res, next) => {
      req.userId = userId;
      next();
    });

    await EventModel.create({
      titleEvent: "Solidary Event",
      publicDescription: "desc",
      privateDescription: "priv",
      date: "2025-08-21",
      location: "Loc",
      creator: userId,
      isSolidary: true,
    });

    const res = await request(app).get(
      "/api/events?isSolidary=true&page=1&limit=10"
    ).set("Authorization", `Bearer ${accessToken}`);
    ;

    expect(res.status).toBe(200);
    expect(res.body.metadata.total).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /api/events → debería rechazar query inválida", async () => {
    mockAuth.mockImplementation((req, _res, next) => {
      req.userId = userId;
      next();
    });

    const res = await request(app).get("/api/events?page=abc&limit=xyz");
    expect(res.status).toBe(400);
    expect(res.body.issues[0].message).toMatch(/page|limit|number|NaN/i);
  });

  // --- PATCH ---
  it("PATCH /api/events/:id → debería actualizar evento propio", async () => {
    mockAuth.mockImplementation((req, _res, next) => {
      req.userId = userId;
      next();
    });
    const event = await EventModel.create({
      titleEvent: "Old Title",
      publicDescription: "desc",
      privateDescription: "priv",
      date: "2025-08-22",
      location: "Loc",
      creator: userId,
    });

    const res = await request(app)
      .patch(`/api/events/${event._id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ titleEvent: "New Title" });

    expect(res.status).toBe(200);
    expect(res.body.titleEvent).toBe("New Title");
  });

  it("PATCH /api/events/:id → debería rechazar body inválido", async () => {
    mockAuth.mockImplementation((req, _res, next) => {
      req.userId = userId;
      next();
    });
    const event = await EventModel.create({
      titleEvent: "Title",
      publicDescription: "desc",
      privateDescription: "priv",
      date: "2025-08-22",
      location: "Loc",
      creator: userId,
    });

    const res = await request(app)
      .patch(`/api/events/${event._id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ date: "not-a-date" });

    expect(res.status).toBe(400);
    expect(res.body.issues[0].message).toMatch(/date/i);
  });

  it("PATCH /api/events/:id → debería rechazar si no es el creador", async () => {
    mockAuth.mockImplementation((req, _res, next) => {
      req.userId = userId;
      next();
    });
    const event = await EventModel.create({
      titleEvent: "Someone else's",
      publicDescription: "desc",
      privateDescription: "priv",
      date: "2025-08-23",
      location: "Loc",
      creator: otherUserId,
    });

    const res = await request(app)
      .patch(`/api/events/${event._id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ titleEvent: "Hack Attempt" });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/No autorizado/);
  });

  it("PATCH /api/events/:id → debería devolver 404 si el evento no existe", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .patch(`/api/events/${fakeId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ titleEvent: "Non existent" });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/no encontrado/i);
  });

  // --- DELETE ---
  it("DELETE /api/events/:id → debería borrar evento propio", async () => {
    mockAuth.mockImplementation((req, _res, next) => {
      req.userId = userId.toString();
      next();
    });


    const event = await EventModel.create({
      titleEvent: "To be deleted",
      publicDescription: "desc",
      privateDescription: "priv",
      date: "2025-08-24",
      location: "Loc",
      creator: userId,
    });

    const res = await request(app)
      .delete(`/api/events/${event._id}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/eliminado/);

    const check = await EventModel.findById(event._id);
    expect(check).toBeNull();
  });

  it("DELETE /api/events/:id → debería rechazar si no es el creador", async () => {
    mockAuth.mockImplementation((req, _res, next) => {
      req.userId = userId;
      next();
    });

    const event = await EventModel.create({
      titleEvent: "Not mine",
      publicDescription: "desc",
      privateDescription: "priv",
      date: "2025-08-25",
      location: "Loc",
      creator: otherUserId,
    });

    const res = await request(app)
      .delete(`/api/events/${event._id}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/No autorizado/);
  });

  it("DELETE /api/events/:id → debería devolver 404 si no existe", async () => {
    mockAuth.mockImplementation((req, _res, next) => {
      req.userId = userId;
      next();
    });

    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/events/${fakeId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/no encontrado/i);
  });
});
