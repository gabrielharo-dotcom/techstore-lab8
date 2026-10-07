const { db } = require('../config/database');

class Producto {
  constructor(row) {
    this.id = row.id;
    this._id = row.id;
    this.nombre = row.nombre;
    this.descripcion = row.descripcion;
    this.precio = Number(row.precio);
    this.stock = Number(row.stock);
    this.tienda = row.tienda;
    this.createdAt = row.createdAt;
    this.updatedAt = row.updatedAt;
  }

  static fromRow(row) {
    return row ? new Producto(row) : null;
  }

  static async find(filtro = {}) {
    let rows;
    if (filtro.tienda) {
      rows = db.prepare('SELECT * FROM productos WHERE tienda = ? ORDER BY createdAt DESC, id DESC').all(filtro.tienda);
    } else {
      rows = db.prepare('SELECT * FROM productos ORDER BY createdAt DESC, id DESC').all();
    }
    return rows.map(row => new Producto(row));
  }

  static async findById(id) {
    const row = db.prepare('SELECT * FROM productos WHERE id = ?').get(Number(id));
    return Producto.fromRow(row);
  }

  static async create(data) {
    if (Array.isArray(data)) {
      const creados = [];
      for (const item of data) creados.push(await Producto.create(item));
      return creados;
    }

    const result = db.prepare(`
      INSERT INTO productos (nombre, descripcion, precio, stock, tienda, updatedAt)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      data.nombre,
      data.descripcion || '',
      Number(data.precio),
      Number(data.stock || 0),
      data.tienda
    );

    return Producto.findById(Number(result.lastInsertRowid));
  }

  static async deleteMany() {
    db.prepare('DELETE FROM productos').run();
  }

  async save() {
    db.prepare(`
      UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, stock = ?, tienda = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      this.nombre,
      this.descripcion || '',
      Number(this.precio),
      Number(this.stock),
      this.tienda,
      Number(this.id)
    );
    return this;
  }

  async deleteOne() {
    db.prepare('DELETE FROM productos WHERE id = ?').run(Number(this.id));
  }
}

module.exports = Producto;
