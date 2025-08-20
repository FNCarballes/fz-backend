import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { UserModel } from "../../models/UserModel";
import {logger} from "../../utils/logger/logger"
import { usersCreated } from "../../utils/monitoring/prometheus";

export const createUserController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, surname, identify, age, email, password, photos } = req.body;

    const normalizedEmail = email.trim().toLowerCase();

    // Verificar si el email ya existe
    const existingUser = await UserModel.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(409).json({ error: "No se puede crear el usuario" }); // 409 Conflict
      return;
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
    usersCreated.inc();
    res.status(201).json({ id: savedUser._id });
    return;
  } catch (error) {
    logger.error({error}, "❌ Error al crear usuario:");
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
