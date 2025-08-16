// ~/config/env.ts
import { cleanEnv, str, port, url, bool } from 'envalid'

//En env.ts con envalid, lo que realmente estás haciendo es definir
//  y tipar las keys (nombres de variables) que debe tener tu archivo
//.env, junto con el tipo de valor que espera cada una (string, 
// número, URL, etc.).

export function validateEnv() {
  return cleanEnv(process.env, {
    PORT: port({
      desc: 'Puerto del servidor Express',
    }),
    MONGO_URI: url({
      desc: 'URL de conexión a MongoDB',
    }),
    JWT_SECRET: str({
      desc: 'Clave secreta para firmar tokens JWT'
    }),
    JWT_REFRESH_SECRET: str({
      desc: 'Clave secreta para firmar tokens de refresco JWT'
    }),
    GOOGLE_CLIENT_ID: str({
      desc: 'ID del cliente de Google para OAuth2'
    }),
    // AWS_ACCESS_KEY_ID: str({
      // desc: 'Clave de acceso AWS para S3'
    // }),
    // AWS_SECRET_ACCESS_KEY: str({
      // desc: 'Secreto de acceso AWS para S3'
    // }),
    // AWS_REGION: str({
      // desc: 'Región AWS donde está tu bucket'
    // }),
    // BUCKET_NAME: str({
      // desc: 'Nombre del bucket S3'
    // }),
    FRONTEND_URL: url({
      desc: '*' //CAMBIAR EN PRODUCCIÓN
    }),
    NODE_ENV: str({
      choices: ['development', 'production', 'test'],
      default: 'development',
      desc: 'Entorno de ejecución'
    }),
    ENABLE_EMAIL_NOTIFICATIONS: bool({
      default: false,
      desc: 'Habilita o deshabilita notificaciones por email'
    }),
  })
}
