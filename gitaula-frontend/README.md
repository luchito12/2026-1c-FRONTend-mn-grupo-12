# GitAula frontend

SPA CSR de React y Vite. La sesión se mantiene exclusivamente en la cookie `HttpOnly` emitida por el backend: el cliente no guarda JWT ni identidad persistente en el navegador.

```bash
npm install
npm run dev
npm test
npm run build
```

Abrir `http://localhost:5173`. Vite redirige `/api` al backend Dockerizado.
Por defecto espera que el contenedor publique `8080:8080`, por lo que usa
`http://localhost:8080`. Si se publica otro puerto, copiar `.env.example` a
`.env` y cambiar `VITE_BACKEND_URL` por la URL publicada en la máquina anfitriona.

El callback OAuth debe ser `http://localhost:5173/auth/callback` (valor por defecto
del backend). En el contenedor deben configurarse `BACKEND_PUBLIC_URL` y
`FRONTEND_AUTH_CALLBACK_URL` con URLs alcanzables por el navegador/GitHub; no con
el hostname interno del servicio Docker.

Las rutas de negocio requieren el contrato `/api` documentado en [CONTRATO_BACKEND_PENDIENTE.md](./CONTRATO_BACKEND_PENDIENTE.md). El frontend no usa las rutas heredadas que requieren enviar `userId` o `creatorUserId`.
