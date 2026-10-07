require('dotenv').config();
const bcrypt = require('bcryptjs');
const conectarDB = require('./config/database');
const { db } = require('./config/database');
const Usuario = require('./models/Usuario');
const Producto = require('./models/Producto');

(async () => {
  try {
    conectarDB();

    await Producto.deleteMany();
    await Usuario.deleteMany();

    const password = await bcrypt.hash('Admin123#', 12);

    await Usuario.create([
      { nombre: 'Administrador TechStore', email: 'admin@techstore.com', password, tienda: 'Central', rol: 'administrador' },
      { nombre: 'Gerente Arequipa', email: 'gerente@techstore.com', password, tienda: 'Arequipa', rol: 'gerente' },
      { nombre: 'Empleado Arequipa', email: 'empleado@techstore.com', password, tienda: 'Arequipa', rol: 'empleado' },
      { nombre: 'Auditor TechStore', email: 'auditor@techstore.com', password, tienda: 'Central', rol: 'auditor' }
    ]);

    await Producto.create([
      { nombre: 'Laptop Lenovo', descripcion: 'Laptop de 15 pulgadas', precio: 2500, stock: 10, tienda: 'Arequipa' },
      { nombre: 'Mouse Logitech', descripcion: 'Mouse inalámbrico', precio: 80, stock: 25, tienda: 'Arequipa' },
      { nombre: 'Monitor Samsung', descripcion: 'Monitor 24 pulgadas', precio: 700, stock: 8, tienda: 'Lima' }
    ]);

    console.log('Datos de prueba creados en SQLite.');
    console.log('Contraseña para todos los usuarios: Admin123#');
    db.close();
  } catch (error) {
    console.error('Error al crear los datos de prueba:', error);
    process.exit(1);
  }
})();
