//~/src/routes/loginRoute.ts
//Importa el framework Express, que se usa para crear servidores web en Node.js.
import express from 'express';
//Importa la función login desde el archivo AuthController.ts (o .js)
//que está en la carpeta auth. Esta función es quien maneja lo que pasa cuando alguien intenta iniciar sesión.
import { login } from '../auth/AuthController';
import { loginRateLimiter } from '../auth/middlewares/rateLimiters';
import { validate } from '../auth/Validate';
import { loginSchema } from '../models/schemasZod/login/loginSchema'; // Asegúrate de que este esquema esté definido
import { refreshTokenController } from '../controllers/usersControllers/loginControllers/refreshTokenController';
const router = express.Router();

//Define una ruta POST:
//URL relativa: /login
//Manejador: la función login importada anteriormente.
//Es decir, cuando llegue una petición POST a /login, se ejecutará la función login.
router.post('/login', validate(loginSchema), loginRateLimiter, login);
router.post("/refresh", refreshTokenController)
export default router;
//Esta porción de código es una ruta (o endpoint) de Express.js que define un manejador para peticiones HTTP de tipo POST al endpoint /login.