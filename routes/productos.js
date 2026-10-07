const express = require('express');
const router = express.Router();
const autenticar = require('../middleware/auth');
const permitirRoles = require('../middleware/roles');
const productoController = require('../controllers/productoController');

router.use(autenticar);
router.get('/', productoController.listar);
router.post('/', permitirRoles('administrador', 'gerente'), productoController.crear);
router.post('/:id/stock', permitirRoles('administrador', 'gerente', 'empleado'), productoController.actualizarStock);
router.post('/:id/precio', permitirRoles('administrador', 'gerente'), productoController.actualizarPrecio);
router.post('/:id/eliminar', permitirRoles('administrador', 'gerente'), productoController.eliminar);

module.exports = router;
