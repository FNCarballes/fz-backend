// tests/routes/eventRoute.test.ts
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../../src/app";
import { UserModel } from "../../src/models/UserModel";
import { EventModel } from "../../src/models/EventsModel";
import { generateTokens } from "../../src/utils/generateTokens";

declare global {
  namespace Express {
    interface Request {
      userId?: mongoose.Types.ObjectId;
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
  });

  beforeEach(async () => {
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

  // --- POST ---
  it("POST /api/events → debería crear un evento", async () => {
    const res = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        titleEvent: "My Event",
        publicDescription: "Public info",
        privateDescription: "Private info",
        date: "2025-08-20",
        location: "Test City",
        isSolidary: true,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");

    const event = await EventModel.findById(res.body.id);
    expect(event).not.toBeNull();
    expect(event?.creator.toString()).toBe(userId.toString());
  });

  it("POST /api/events → debería rechazar si falta un campo requerido", async () => {
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
    expect(res.body.issues[0].message).toMatch(/titleEvent/i);
  });

  it("POST /api/events → debería rechazar si no hay token", async () => {
    const res = await request(app).post("/api/events").send({
      titleEvent: "No Auth Event",
      publicDescription: "desc",
      privateDescription: "priv",
      date: "2025-08-20",
      location: "Loc",
    });

    expect(res.status).toBe(401);
  });

  // --- GET ---
  it("GET /api/events → debería devolver lista de eventos", async () => {
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
    );

    expect(res.status).toBe(200);
    expect(res.body.metadata.total).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /api/events → debería rechazar query inválida", async () => {
    const res = await request(app).get("/api/events?page=abc&limit=xyz");
    expect(res.status).toBe(400);
    expect(res.body.issues[0].message).toMatch(/page|limit/i);
  });

  // --- PATCH ---
  it("PATCH /api/events/:id → debería actualizar evento propio", async () => {
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
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/events/${fakeId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/no encontrado/i);
  });
});
