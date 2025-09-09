// authController.ts
//Esto permite tipar correctamente los parámetros de la función para tener autocompletado y validaciones en TypeScript.
import { Request, Response } from "express";
//Importa jsonwebtoken, una biblioteca para generar y verificar tokens JWT (JSON Web Tokens), usados para autenticación.
import jwt from "jsonwebtoken";
//Importa bcrypt, una biblioteca para hashing (encriptado unidireccional) y comparar contraseñas.
import bcrypt from "bcrypt";
//Se importa el modelo de usuario de Mongoose.
//Se renombra el modelo (UserModel) como User para usarlo en el código más fácilmente.
import { UserModel as User } from "../../../models/UserModel"; // Asegúrate de tipar el modelo adecuadamente
//Importa una interfaz de TypeScript que define la estructura de un usuario
// (IUser) para garantizar que el objeto tiene las propiedades esperadas, como email, password, etc.
import { generateTokens } from "../../../utils/generateTokens"; // Importa la función para generar tokens
//Recibe una petición (req) y una respuesta (res) y no devuelve nada (Promise<void>).
//Es usada como controlador cuando un usuario intenta iniciar sesión.
import { logger } from "../../../utils/logger/logger"
import { IUserDocument } from "../../../models/UserModel";
export const login = async (req: Request, res: Response): Promise<void> => {
  // Se extraen los campos email y password que el usuario envía desde el frontend.
  const { email, password, deviceId } = req.body;
  console.log(req.body, "📩 Body recibido en login")

  // Se valida que ambos campos estén presentes.
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne<IUserDocument>({ email: normalizedEmail });
    if (!user) {
      res.status(401).json({ "message": "Usuario o contraseña inválidos" });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      res.status(401).json({ "message": "Usuario o contraseña inválidos" });
      return;
    }

    if (user && validPassword) {
      const { accessToken, refreshToken } = await generateTokens(
        user._id.toString(),
        user.email
      );

      // ✅ Buscar si ya existe este dispositivo
      const existingDevice = user.devices.find((d) => d.deviceId === deviceId);

      let currentDevice;

      if (existingDevice) {
        existingDevice.lastLogin = new Date();
        currentDevice = existingDevice;
      } else {
        const newDevice = {
          deviceId,
          lastLogin: new Date(),
          userAgent: req.headers["user-agent"],
        };
        user.devices.push(newDevice);
        currentDevice = newDevice;
      }

      await user.save();


      const userId = user._id.toString();
      const name = user.name;
      const surname = user.surname;
      const identify = user.identify;
      const age = user.age;
      const photos = user.photos;

      res.json({
        accessToken,
        refreshToken,
        deviceId: currentDevice.deviceId,
        userId,
        name,
        surname,
        identify,
        age,
        photos,
      });
    } else {
      res.status(401).json({ message: "Usuario o contraseña incorrectos" });
    }
  } catch (error) {
    logger.error({ error }, "Login error:"); // Registra el error completo en el servidor
    res.status(500).json({ message: "Error del servidor" }); // Envía un mensaje genérico al cliente
  }
};
