function permitirRoles(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).render('error', {
        titulo: 'Acceso denegado',
        mensaje: 'No tienes permisos para realizar esta acción.'
      });
    }
    next();
  };
}

module.exports = permitirRoles;
