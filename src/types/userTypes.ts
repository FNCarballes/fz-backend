//userTypes.ts
import mongoose, { Document } from "mongoose";
export interface IDevice {
  deviceId: string;
  lastLogin: Date;
  userAgent?: string;
}

//extends Document: La interfaz IUser hereda de Document, que es una interfaz provista por Mongoose.
//Eso quiere decir que un IUser es un documento de MongoDB, y por lo tanto tiene todos los métodos y propiedades de un documento de Mongoose
export interface IUser extends Document {
  name: string;
  surname: string;
  identify: string;
  age: number;
  email: string;
  password: string;
  _id: any;
  photos?: string[]; // Array de strings para las fotos
  eventRequestsSent: mongoose.Types.ObjectId[]; // o incluso: (IEvent | mongoose.Types.ObjectId)[]
  userAgent?: string; // opcional, si no se usa en tu aplicación
  devices: IDevice[];
  // otros campos opcionales
}
