const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = process.env.SQLITE_PATH
  ? path.resolve(process.env.SQLITE_PATH)
  : path.join(dataDir, 'techstore.db');

const db = new DatabaseSync(dbPath);

db.exec('PRAGMA foreign_keys = ON;');

function conectarDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT,
      tienda TEXT NOT NULL,
      rol TEXT NOT NULL DEFAULT 'empleado' CHECK (rol IN ('administrador','gerente','empleado','auditor')),
      proveedor TEXT NOT NULL DEFAULT 'local' CHECK (proveedor IN ('local','google','github')),
      proveedorId TEXT,
      intentosFallidos INTEGER NOT NULL DEFAULT 0,
      bloqueado INTEGER NOT NULL DEFAULT 0,
      codigoMFA TEXT,
      expiracionMFA TEXT,
      intentosMFA INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      precio REAL NOT NULL CHECK (precio >= 0),
      stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
      tienda TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
    CREATE INDEX IF NOT EXISTS idx_productos_tienda ON productos(tienda);
  `);

  console.log(`SQLite conectado: ${dbPath}`);
}

module.exports = conectarDB;
module.exports.db = db;
module.exports.dbPath = dbPath;
