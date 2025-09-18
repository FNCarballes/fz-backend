import { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import { UserModel } from "../../dataStructure/mongooseModels/UserModel";
import { sendResponse } from "../../utils/helpers/apiResponse";
import { usersCreated } from "../../utils/monitoring/prometheus";

export const createUserController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log(req.body, "📩 Body recibido en createUserController")
    const { name, surname, identify, age, email, password, photos } = req.body;
    console.log({ name, surname, identify, age, email, photos }, "✅ Campos parseados");
    const normalizedEmail = email.trim().toLowerCase();

    // Verificar si el email ya existe
    const existingUser = await UserModel.findOne({ email: normalizedEmail });
    if (existingUser) {
      sendResponse(res, {
        statusCode: 409,
        success: false,
        message: "No es posible registrar este correo."
      });
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
    sendResponse(res, {
      statusCode: 201,
      success: true,
    });
    return;
  } catch (error) {
    next(error)
  }
};
