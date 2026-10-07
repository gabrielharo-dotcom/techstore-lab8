const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

async function autenticar(req, res, next) {
  try {
    const token = req.cookies.token;
    if (!token) return res.redirect('/login');

    const datos = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.findById(datos.id);
    if (!usuario) return res.redirect('/login');

    req.usuario = usuario;
    res.locals.usuario = usuario;
    next();
  } catch (error) {
    res.clearCookie('token');
    res.redirect('/login');
  }
}

module.exports = autenticar;
