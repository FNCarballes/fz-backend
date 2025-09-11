// src/types/ApiResponse.ts
export interface ApiResponse<T = undefined> {
  statusCode: number;  // HTTP status code
  success: boolean;    // true | false
  message?: string;     // texto legible
  data?: T;            // opcional, si hay payload extra
}
// T → te permite tipar el data si hay datos que devolver (ej. usuario, lista de eventos, etc.).
// 
// data es opcional: solo lo mandás en endpoints que devuelven información.
// 
// Esto asegura que siempre tengas statusCode, success, message.