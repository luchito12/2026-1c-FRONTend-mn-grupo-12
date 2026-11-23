# GitAula frontend

Aplicación React con JavaScript para la integración con GitHub.

```bash
npm install
npm run dev
```

Abrir `http://localhost:5173`. Vite redirige `/api` al backend Dockerizado.
Por defecto espera que el contenedor publique `8080:8080`, por lo que usa
`http://localhost:8080`. Si se publica otro puerto, copiar `.env.example` a
`.env` y cambiar `VITE_BACKEND_URL` por la URL publicada en la máquina anfitriona.

El callback OAuth debe ser `http://localhost:5173/auth/callback` (valor por defecto
del backend). En el contenedor deben configurarse `BACKEND_PUBLIC_URL` y
`FRONTEND_AUTH_CALLBACK_URL` con URLs alcanzables por el navegador/GitHub; no con
el hostname interno del servicio Docker.
