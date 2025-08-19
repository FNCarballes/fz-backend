// tests/routes/userRoute.test.ts
jest.mock("../../src/sockets/forEventRequest/eventEmmiters", () => ({ emitToAll: jest.fn() }));
const mockAuth = jest.fn();
jest.mock("../../src/auth/middlewares/authMiddleware", () => ({
  authMiddleware: (req: any, res: any, next: any) => mockAuth(req, res, next),
}));
jest.mock("../../src/auth/middlewares/rateLimiters", () => ({
  limitCreateUser: (_req: any, _res: any, next: any) => next(),
  limitEventRequestsSent: (_req: any, _res: any, next: any) => next(),
  loginRateLimiter: (_req: any, _res: any, next: any) => next(),
  limitPostEventRequest: (_req: any, _res: any, next: any) => next(),
  limitPatchEventRequest: (_req: any, _res: any, next: any) => next(),
}));

import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../../src/app";
import { UserModel } from "../../src/models/UserModel";
import { EventModel } from "../../src/models/EventsModel";
import { generateTokens } from "../../src/utils/generateTokens";
import { EventRequestModel } from "../../src/models/EventRequestModel";

declare global {
  namespace Express {
    interface Request {
      userId?: string; // importante: string para alinear con auth real
    }
  }
}

describe("User Routes", () => {
  let mongoServer: MongoMemoryServer;
  let userId: mongoose.Types.ObjectId;
  let accessToken: string;
  let eventId: mongoose.Types.ObjectId;
// let requestId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.disconnect();
    await mongoose.connect(uri);

    // mock de socket.io (por si algún controller lo usa)
    const fakeIo = { to: jest.fn().mockReturnThis(), emit: jest.fn() };
    app.set("io", fakeIo);
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    // Autenticación mockeada: siempre string
    mockAuth.mockImplementation((req, _res, next) => {
      if (userId) req.userId = userId.toString();
      next();
    });

    await UserModel.deleteMany({});
    await EventModel.deleteMany({});

    // Usuario autenticado base
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

    const tokens = await generateTokens(
      userId.toString(),
      "testuser@example.com",
      "test-agent",
      "127.0.0.1",
      "test-device"
    );
    accessToken = tokens.accessToken;

    // Evento base (para requests enviados)
    const event = await EventModel.create({
      titleEvent: "Sample Event",
      publicDescription: "Public desc",
      privateDescription: "Private desc",
      date: "2025-08-30",
      location: "Somewhere",
      creator: userId,
      isSolidary: false,
      requests: [],
    });
    eventId = event._id;

//   const eventRequest = await EventRequestModel.create({
//     userId: userId,
//     eventId: eventId,
//     status: "pending"
//   });
//   requestId = eventRequest._id;

  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  // --- POST /api/users ---
  it("POST /api/users → debería crear un usuario", async () => {
    const res = await request(app)
      .post("/api/users")
      .send({
        name: "Nuevo",
        surname: "Usuario",
        identify: "999999",
        age: 22,
        email: "newuser@example.com",
        password: "supersecret",
        photos: [],
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");

    const created = await UserModel.findById(res.body.id);
    expect(created).not.toBeNull();
    expect(created?.email).toBe("newuser@example.com");
  });

  it("POST /api/users → debería rechazar si falta un campo requerido", async () => {
    const res = await request(app)
      .post("/api/users")
      .send({
        // Falta email (por ejemplo)
        name: "Pepe",
        surname: "Argento",
        identify: "111111",
        age: 40,
        password: "123456",
        photos: [],
      });

    expect(res.status).toBe(400);
    // el schema suele exponer issues con path
    expect(res.body?.issues?.[0]?.path || res.body?.issues?.[0]?.key).toMatch(/email/i);
  });
  
it("POST /api/users/eventRequestsSent → debería agregar un request enviado", async () => {
  // Creamos el EventRequest manualmente (todavía no está en el usuario)
  const requestId = await EventRequestModel.create({
    userId: userId,
    eventId: eventId,
    status: "pending",
  });

  const res = await request(app)
    .post("/api/users/eventRequestsSent")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ requestId: requestId._id.toString() });

  expect([200, 201]).toContain(res.status);

  const user = await UserModel.findById(userId);
  const list = (user?.eventRequestsSent || []).map((id) => id.toString());
  expect(list).toContain(requestId._id.toString());
});



it("POST /api/users/eventRequestsSent → debería rechazar duplicados", async () => {
  const requestId = await EventRequestModel.create({
    userId: userId,
    eventId: eventId,
    status: "pending",
  });

  // Primer agregado
  await request(app)
    .post("/api/users/eventRequestsSent")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ requestId: requestId._id.toString() });

  // Intento duplicado
  const res = await request(app)
    .post("/api/users/eventRequestsSent")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ requestId: requestId._id.toString() });

expect(res.status).toBe(409);
  if (res.status === 409) {
    expect(res.body?.message || res.body?.error).toMatch(/El request ya fue agregado previamente/i);
  }
});



  // --- GET /api/users/eventRequestsSent ---
it("GET /api/users/eventRequestsSent → debería devolver los requests enviados", async () => {
      const requestId = await EventRequestModel.create({
    userId: userId,
    eventId: eventId,
    status: "pending",
  });
  await request(app)
    .post("/api/users/eventRequestsSent")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ requestId: requestId._id.toString() });

  const res = await request(app)
    .get("/api/users/eventRequestsSent")
    .set("Authorization", `Bearer ${accessToken}`);

  expect(res.status).toBe(200);

  const body = res.body;
  const list: any[] =
    Array.isArray(body?.data) ? body.data :
    Array.isArray(body?.eventRequestsSent) ? body.eventRequestsSent :
    Array.isArray(body) ? body : [];

  const asStrings = list
    .map((it) => {
      if (typeof it === "string") return it;
      if (it?._id) return it._id.toString?.();
      if (it?.id) return String(it.id);
      if (it?.requestId) return it.requestId.toString?.();
      return null;
    })
    .filter(Boolean);

  expect(asStrings).toContain(requestId._id.toString());
});


// --- DELETE /api/users/eventRequestsSent/:eventId ---
it("DELETE /api/users/eventRequestsSent/:requestId → debería eliminar el request enviado", async () => {
  const requestId = await EventRequestModel.create({
    userId: userId,
    eventId: eventId,
    status: "pending",
  });

  await request(app)
    .post("/api/users/eventRequestsSent")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ requestId: requestId._id.toString() });

  const res = await request(app)
    .delete(`/api/users/eventRequestsSent/${requestId._id}`)
    .set("Authorization", `Bearer ${accessToken}`);

  expect([200, 204]).toContain(res.status);
  if (res.status === 200) {
    expect(res.body?.message || "").toMatch(/eliminad|borrad/i);
  }

  const user = await UserModel.findById(userId);
  const list = (user?.eventRequestsSent || []).map(id => id.toString());
  expect(list).not.toContain(requestId._id.toString());
});



it("DELETE /api/users/eventRequestsSent/:eventId → 404 si el request no existe", async () => {
  const fakeId = new mongoose.Types.ObjectId();

  const res = await request(app)
    .delete(`/api/users/eventRequestsSent/${fakeId}`)
    .set("Authorization", `Bearer ${accessToken}`);

  expect([res.status]).toContain(404); // ✅ solo 404 acá
  expect(res.body?.error || res.body?.message).toMatch(/Solicitud no encontrada en el usuario/i);
});
});
