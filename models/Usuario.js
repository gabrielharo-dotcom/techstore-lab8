const { db } = require('../config/database');

class Usuario {
  constructor(row) {
    this.id = row.id;
    this._id = row.id;
    this.nombre = row.nombre;
    this.email = row.email;
    this.password = row.password;
    this.tienda = row.tienda;
    this.rol = row.rol;
    this.proveedor = row.proveedor;
    this.proveedorId = row.proveedorId;
    this.intentosFallidos = Number(row.intentosFallidos || 0);
    this.bloqueado = Boolean(row.bloqueado);
    this.codigoMFA = row.codigoMFA;
    this.expiracionMFA = row.expiracionMFA ? new Date(row.expiracionMFA) : null;
    this.intentosMFA = Number(row.intentosMFA || 0);
    this.createdAt = row.createdAt;
    this.updatedAt = row.updatedAt;
  }

  static fromRow(row) {
    return row ? new Usuario(row) : null;
  }

  static async findById(id) {
    const row = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(Number(id));
    return Usuario.fromRow(row);
  }

  static async findOne(query) {
    if (query.$or && Array.isArray(query.$or)) {
      for (const item of query.$or) {
        const encontrado = await Usuario.findOne(item);
        if (encontrado) return encontrado;
      }
      return null;
    }

    if (query.email !== undefined) {
      const row = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(String(query.email).toLowerCase());
      return Usuario.fromRow(row);
    }

    if (query.proveedor !== undefined && query.proveedorId !== undefined) {
      const row = db.prepare('SELECT * FROM usuarios WHERE proveedor = ? AND proveedorId = ?')
        .get(query.proveedor, String(query.proveedorId));
      return Usuario.fromRow(row);
    }

    return null;
  }

  static async create(data) {
    if (Array.isArray(data)) {
      const creados = [];
      for (const item of data) creados.push(await Usuario.create(item));
      return creados;
    }

    const stmt = db.prepare(`
      INSERT INTO usuarios
      (nombre, email, password, tienda, rol, proveedor, proveedorId, intentosFallidos, bloqueado, codigoMFA, expiracionMFA, intentosMFA, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    const result = stmt.run(
      data.nombre,
      String(data.email).toLowerCase(),
      data.password ?? null,
      data.tienda,
      data.rol || 'empleado',
      data.proveedor || 'local',
      data.proveedorId ?? null,
      data.intentosFallidos || 0,
      data.bloqueado ? 1 : 0,
      data.codigoMFA ?? null,
      data.expiracionMFA ? new Date(data.expiracionMFA).toISOString() : null,
      data.intentosMFA || 0
    );

    return Usuario.findById(Number(result.lastInsertRowid));
  }

  static async deleteMany() {
    db.prepare('DELETE FROM usuarios').run();
  }

  async save() {
    db.prepare(`
      UPDATE usuarios SET
        nombre = ?, email = ?, password = ?, tienda = ?, rol = ?, proveedor = ?, proveedorId = ?,
        intentosFallidos = ?, bloqueado = ?, codigoMFA = ?, expiracionMFA = ?, intentosMFA = ?,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      this.nombre,
      String(this.email).toLowerCase(),
      this.password ?? null,
      this.tienda,
      this.rol,
      this.proveedor,
      this.proveedorId ?? null,
      Number(this.intentosFallidos || 0),
      this.bloqueado ? 1 : 0,
      this.codigoMFA ?? null,
      this.expiracionMFA ? new Date(this.expiracionMFA).toISOString() : null,
      Number(this.intentosMFA || 0),
      Number(this.id)
    );
    return this;
  }
}

module.exports = Usuario;
