# TechStore - Laboratorio 8 con SQLite

Aplicación web para el laboratorio calificado de Desarrollo de Soluciones en la Nube.

## Base de datos

Este proyecto usa SQLite mediante el módulo `node:sqlite` incluido en Node.js moderno. No necesitas instalar MongoDB, MySQL ni un servidor de base de datos.

La base se crea automáticamente en:

```text
data/techstore.db
```

## Funcionalidades implementadas

- Registro de usuarios con email único.
- Contraseña segura: mínimo 8 caracteres, una mayúscula, un número y un carácter especial.
- Contraseñas cifradas con bcrypt.
- Login con validación de credenciales.
- Bloqueo después de 5 intentos fallidos.
- Autenticación con Google.
- Autenticación con GitHub.
- MFA por correo con código de 6 dígitos.
- Código MFA válido durante 5 minutos.
- Máximo 3 intentos MFA.
- JWT almacenado en cookie HttpOnly.
- Roles: administrador, gerente, empleado y auditor.
- Inventario básico con permisos según rol.

## Requisitos

- Node.js 22.5 o superior. Recomendado Node.js 24.

## Instalación en PowerShell

Como en las PCs de Tecsup PowerShell puede bloquear `npm.ps1`, usa `npm.cmd`:

```powershell
npm.cmd install
```

Copia `.env.example` y crea un archivo llamado `.env`.

Luego carga los datos de prueba:

```powershell
npm.cmd run seed
```

Después ejecuta:

```powershell
npm.cmd start
```

Abre en el navegador:

```text
http://localhost:3000
```

## Usuarios de prueba

Contraseña para todos:

```text
Admin123#
```

Usuarios:

- admin@techstore.com
- gerente@techstore.com
- empleado@techstore.com
- auditor@techstore.com

## MFA sin correo configurado

Si `EMAIL_USER` y `EMAIL_PASS` están vacíos, el código MFA aparecerá en la terminal de Visual Studio Code. Esto permite probar el laboratorio sin configurar Gmail.

## Google y GitHub

Los botones están implementados, pero para que funcionen necesitas crear credenciales OAuth y completar sus variables en `.env`.

## Conclusión sugerida

En este laboratorio aprendí a implementar diferentes mecanismos de seguridad dentro de una aplicación web. Comprendí que una contraseña segura por sí sola no es suficiente, por lo que también implementé el bloqueo por intentos fallidos y la autenticación multifactor. Además, utilicé JWT para controlar el acceso de los usuarios y trabajé con distintos roles para limitar las acciones dentro del sistema de inventario. También comprendí cómo integrar métodos externos de autenticación como Google y GitHub. Finalmente, utilicé SQLite para almacenar usuarios, productos y datos de seguridad de forma local, sin depender de un servidor de base de datos adicional.
