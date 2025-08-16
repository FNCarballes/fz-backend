import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../../src/index";
import { UserModel } from "../../src/models/UserModel";
import { EventModel } from "../../src/models/EventsModel";
import { EventRequestModel } from "../../src/models/EventRequestModel";

// Augment Express Request type to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: mongoose.Types.ObjectId;
    }
  }
}

describe("POST /api/eventRequests", () => {
  let mongoServer: MongoMemoryServer;
  let userId: mongoose.Types.ObjectId;
  let eventId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.disconnect();
    await mongoose.connect(uri);
  });

  beforeEach(async () => {
    await UserModel.deleteMany({});
    await EventModel.deleteMany({});
    await EventRequestModel.deleteMany({});

    // Crear usuario de prueba
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

    // Crear evento de prueba
    const event = await EventModel.create({
      titleEvent: "Test Event",
      publicDescription: "Public desc",
      privateDescription: "Private desc",
      date: "2025-08-16",
      location: "Test Location",
      creator: userId,
      isSolidary: false,
      requests: [],
    });
    eventId = event._id;
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it("debería crear una solicitud de evento correctamente", async () => {
    // Simular autenticación: mockear el middleware para este test
    // Si usás JWT, deberías generar un token válido y enviarlo en el header
    // Aquí asumimos que el middleware setea req.userId
    const agent = request(app);

    // Mockear el middleware de auth para este test
    // Si tu app requiere JWT, adaptá este paso
    app.use((req, res, next) => {
      req.userId = userId;
      next();
    });

    const res = await agent
      .post("/api/eventRequests")
      .send({ eventId: eventId.toString() })
      .set("Accept", "application/json");

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");

    // Verificar que se creó en la base
    const eventRequest = await EventRequestModel.findOne({ userId, eventId });
    expect(eventRequest).not.toBeNull();
    expect(eventRequest?.status).toBe("pending");
  });

  it("debería rechazar solicitudes duplicadas", async () => {
    await EventRequestModel.create({ userId, eventId, status: "pending" });
    const agent = request(app);
    app.use((req, res, next) => {
      req.userId = userId;
      next();
    });
    const res = await agent
      .post("/api/eventRequests")
      .send({ eventId: eventId.toString() })
      .set("Accept", "application/json");
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/Ya existe una solicitud/);
  });

  it("debería rechazar eventId inválido", async () => {
    const agent = request(app);
    app.use((req, res, next) => {
      req.userId = userId;
      next();
    });
    const res = await agent
      .post("/api/eventRequests")
      .send({ eventId: "invalid-id" })
      .set("Accept", "application/json");
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/eventId inválido/);
  });
});
