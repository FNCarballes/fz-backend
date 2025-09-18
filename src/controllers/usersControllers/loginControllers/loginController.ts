// authController.ts
//Esto permite tipar correctamente los parámetros de la función para tener autocompletado y validaciones en TypeScript.
import { NextFunction, Request, Response } from "express";
//Importa jsonwebtoken, una biblioteca para generar y verificar tokens JWT (JSON Web Tokens), usados para autenticación.
//Importa bcrypt, una biblioteca para hashing (encriptado unidireccional) y comparar contraseñas.
import bcrypt from "bcrypt";
//Se importa el modelo de usuario de Mongoose.
//Se renombra el modelo (UserModel) como User para usarlo en el código más fácilmente.
import { UserModel as User } from "../../../dataStructure/mongooseModels/UserModel"; // Asegúrate de tipar el modelo adecuadamente
//Importa una interfaz de TypeScript que define la estructura de un usuario
// (IUser) para garantizar que el objeto tiene las propiedades esperadas, como email, password, etc.
import { generateTokens } from "../../../utils/helpers/generateTokens"; // Importa la función para generar tokens
//Recibe una petición (req) y una respuesta (res) y no devuelve nada (Promise<void>).
//Es usada como controlador cuando un usuario intenta iniciar sesión.
import { logger } from "../../../utils/logger/logger"
import { IUserDocument } from "../../../dataStructure/mongooseModels/UserModel";
import { sendResponse } from "../../../utils/helpers/apiResponse";
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Se extraen los campos email y password que el usuario envía desde el frontend.
  const { email, password, deviceId } = req.body;
  console.log(req.body, "📩 Body recibido en login")

  // Se valida que ambos campos estén presentes.
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne<IUserDocument>({ email: normalizedEmail });
    if (!user) {
      sendResponse(res, {
        statusCode: 401,
        success: false,
        message: "Usuario o contraseña inválidos."
      });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      sendResponse(res, {
        statusCode: 401,
        success: false,
        message: "Usuario o contraseña inválidos."
      });
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
      sendResponse(res, {
        statusCode: 200,
        success: true,
        data: {
          accessToken,
          refreshToken,
          deviceId: currentDevice.deviceId,
          userId,
          name,
          surname,
          identify,
          age,
          photos,
        }
      });
      return;
    } else {
      sendResponse(res, {
        statusCode: 401,
        success: false,
        message: "Auth falló."
      });
      return;
    }
  } catch (error) {
    next(error)
  }
};
