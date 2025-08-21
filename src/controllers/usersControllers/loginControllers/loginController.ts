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
import { IUser } from "../../../types/userTypes"; // Asumiendo que defines esta interfaz
import { generateTokens } from "../../../utils/generateTokens"; // Importa la función para generar tokens
//Recibe una petición (req) y una respuesta (res) y no devuelve nada (Promise<void>).
//Es usada como controlador cuando un usuario intenta iniciar sesión.
import {logger} from "../../../utils/logger/logger"
export const login = async (req: Request, res: Response): Promise<void> => {
  // Se extraen los campos email y password que el usuario envía desde el frontend.
  const { email, password } = req.body;
console.log(req.body, "📩 Body recibido en login")
  // Se valida que ambos campos estén presentes.
  try {
    const user = (await User.findOne({ email })) as IUser | null;
    if (!user) {
      res.status(401).json({ message: "Usuario no encontrado" });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      res.status(401).json({ message: "Credenciales inválidas" });
      return;
    }

    if (user && validPassword) {
   const { accessToken, refreshToken } = await generateTokens(
  user._id.toString(),
  user.email,
  req.headers['user-agent'] || "unknown",
  req.ip || "unknown",
  "login-device" // Puedes ajustar el nombre del dispositivo si lo tienes
);

      const userId = user._id.toString(); // Convierte el ObjectId a string
      const userName = user.name; // Convierte el ObjectId a string
      const userSurname = user.surname; // Convierte el ObjectId a string
      const userIdentify = user.identify; // Convierte el ObjectId a string
      const userAge = user.age; // Convierte el ObjectId a string
      const userPhotos = user.photos; // Convierte el ObjectId a string
      res.json({
        accessToken,
        refreshToken,
        userId,
        userName,
        userSurname,
        userIdentify,
        userAge,
        userPhotos,
      });
    } else {
      res.status(401).json({ message: "Usuario o contraseña incorrectos" });
    }
  } catch (error) {
    logger.error({error}, "Login error:" ); // Registra el error completo en el servidor
    res.status(500).json({ message: "Error del servidor" }); // Envía un mensaje genérico al cliente
  }
};
