//userRout.ts
import express from "express";
import { UserModel } from "../models/User";
import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { authMiddleware } from "../auth/authMiddleware";
import "../models/Events"; // Importar solo para registrar el modelo
import { AuthRequest } from "../types/express";
import mongoose from "mongoose";

const router = express.Router();

router.post("/users", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, surname, identify, age, email, password, photos } = req.body;

    // Validación básica
    if (!name || !email || !password) {
      res.status(400).json({ error: "Email y contraseña son obligatorios" });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Verificar si el email ya existe
    const existingUser = await UserModel.findOne({ email: normalizedEmail });
    if (existingUser) {
    res.status(409).json({ error: "El email ya está en uso" }); // 409 Conflict
    return
    }

    // Encriptar la contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    //Este objeto representa un nuevo documento que será insertado en la colección de usuarios (users, por convención).
    const newUser = new UserModel({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      surname,
      identify,
      age,
      photos,
    });
    //.save() es un método que hereda cualquier objeto creado con un modelo de Mongoose.
    const savedUser = await newUser.save();

    res.status(201).json({ id: savedUser._id });
    return
  } catch (error) {
    console.error("❌ Error al crear usuario:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post(
  "/users/eventRequestsSent",
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).userId;
    const { requestId } = req.body;

    if (!userId || !requestId) {
      res
        .status(400)
        .json({ error: "Falta el requestId o el token de usuario" });
      return;
    }
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      res.status(400).json({ error: "ID inválido" });
      return
    }

    try {
      // Esto está perfecto. Buscás al usuario en la base antes de modificarlo.

      const user = await UserModel.findById(userId);
      if (!user) {
        res.status(404).json({ error: "Usuario no encontrado" });
        return;
      }

      // Evitar duplicados
      //Este método de JavaScript verifica si al menos un elemento del
      // arreglo cumple una condición.
      //Retorna true si encuentra uno que la cumpla.
      if (!user.eventRequestsSent.some((id) => id.toString() === requestId)) {
        user.eventRequestsSent.push(requestId);
        await user.save();
      }

      res.status(200).json({ message: "Solicitud de evento agregada" });
      return
    } catch (error) {
      console.error("❌ Error al agregar solicitud de evento:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
);

router.get(
  "/users/eventRequestsSent",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId;
    if (!userId) {
      res.status(400).json({ error: "userId es obligatorio" });
      return;
    }

    try {
      const user = await UserModel.findById(userId).populate(
        "eventRequestsSent",
        "eventId titleEvent status"
      );

      if (!user) {
        res.status(404).json({ error: "Usuario no encontrado" });
        return;
      }

      res.status(200).json({ eventRequestsSent: user.eventRequestsSent });
      return
    } catch (error) {
      console.error("❌ Error al obtener solicitudes de evento:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
);

router.delete(
  "/users/eventRequestsSent/:eventId",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId;
    const { eventId } = req.params;

    if (!userId || !eventId) {
      res.status(400).json({ error: "userId y eventId son obligatorios" });
      return;
    }

    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        res.status(404).json({ error: "Usuario no encontrado" });
        return;
      }

      user.eventRequestsSent = user.eventRequestsSent.filter(
        (id) => id.toString() !== eventId
      );
      await user.save();

      res.status(200).json({ message: "Solicitud de evento eliminada" });
    } catch (error) {
      console.error("❌ Error al eliminar solicitud de evento:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
);

export default router;
