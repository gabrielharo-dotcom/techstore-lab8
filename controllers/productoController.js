const Producto = require('../models/Producto');

exports.listar = async (req, res) => {
  try {
    let filtro = {};
    if (req.usuario.rol === 'gerente' || req.usuario.rol === 'empleado') {
      filtro.tienda = req.usuario.tienda;
    }
    const productos = await Producto.find(filtro);
    res.render('productos', { titulo: 'Productos', productos });
  } catch (error) {
    res.status(500).render('error', { titulo: 'Error', mensaje: 'No se pudieron cargar los productos.' });
  }
};

exports.crear = async (req, res) => {
  try {
    const { nombre, descripcion, precio, stock, tienda } = req.body;
    await Producto.create({ nombre, descripcion, precio, stock, tienda });
    res.redirect('/productos');
  } catch (error) {
    res.status(500).render('error', { titulo: 'Error', mensaje: 'No se pudo crear el producto.' });
  }
};

exports.actualizarStock = async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) return res.status(404).render('error', { titulo: 'Error', mensaje: 'Producto no encontrado.' });

    if ((req.usuario.rol === 'gerente' || req.usuario.rol === 'empleado') && producto.tienda !== req.usuario.tienda) {
      return res.status(403).render('error', { titulo: 'Acceso denegado', mensaje: 'Solo puedes modificar productos de tu tienda.' });
    }

    producto.stock = Number(req.body.stock);
    await producto.save();
    res.redirect('/productos');
  } catch (error) {
    res.status(500).render('error', { titulo: 'Error', mensaje: 'No se pudo actualizar el stock.' });
  }
};

exports.actualizarPrecio = async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) return res.status(404).render('error', { titulo: 'Error', mensaje: 'Producto no encontrado.' });

    if (req.usuario.rol === 'gerente' && producto.tienda !== req.usuario.tienda) {
      return res.status(403).render('error', { titulo: 'Acceso denegado', mensaje: 'Solo puedes modificar productos de tu tienda.' });
    }

    producto.precio = Number(req.body.precio);
    await producto.save();
    res.redirect('/productos');
  } catch (error) {
    res.status(500).render('error', { titulo: 'Error', mensaje: 'No se pudo actualizar el precio.' });
  }
};

exports.eliminar = async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) return res.status(404).render('error', { titulo: 'Error', mensaje: 'Producto no encontrado.' });

    if (req.usuario.rol === 'gerente' && producto.tienda !== req.usuario.tienda) {
      return res.status(403).render('error', { titulo: 'Acceso denegado', mensaje: 'No puedes eliminar productos de otras tiendas.' });
    }

    await producto.deleteOne();
    res.redirect('/productos');
  } catch (error) {
    res.status(500).render('error', { titulo: 'Error', mensaje: 'No se pudo eliminar el producto.' });
  }
};
