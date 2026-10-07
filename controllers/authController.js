const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const Usuario = require('../models/Usuario');

function passwordValida(password) {
  return /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password);
}

function generarCodigoMFA() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generarToken(usuario) {
  return jwt.sign(
    {
      id: usuario._id,
      email: usuario.email,
      rol: usuario.rol
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '2h'
    }
  );
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT || 587),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function enviarCodigo(email, codigo) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`MFA para ${email}: ${codigo}`);
    return;
  }

  await transporter.sendMail({
    from: `"TechStore" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Código de verificación MFA - TechStore',
    html: `
      <h2>TechStore</h2>
      <h3>Verificación de seguridad</h3>

      <p>Tu código MFA es:</p>

      <h1>${codigo}</h1>

      <p>Este código es válido por 5 minutos.</p>

      <p>Si no solicitaste este código, puedes ignorar este mensaje.</p>
    `
  });

  console.log(`MFA enviado correctamente a ${email}`);
}

async function prepararMFA(usuario, req) {
  const codigo = generarCodigoMFA();

  usuario.codigoMFA = await bcrypt.hash(codigo, 10);
  usuario.expiracionMFA = new Date(Date.now() + 5 * 60 * 1000);
  usuario.intentosMFA = 0;

  await usuario.save();

  req.session.mfaUsuarioId = usuario._id.toString();

  await enviarCodigo(usuario.email, codigo);
}

exports.verRegistro = (req, res) => {
  res.render('registro', {
    titulo: 'Registro'
  });
};

exports.verLogin = (req, res) => {
  res.render('login', {
    titulo: 'Iniciar sesión'
  });
};

exports.verMFA = (req, res) => {
  if (!req.session.mfaUsuarioId) {
    return res.redirect('/login');
  }

  res.render('mfa', {
    titulo: 'Verificación MFA'
  });
};

exports.registrar = async (req, res) => {
  try {
    const {
      nombre,
      email,
      password,
      tienda,
      rol
    } = req.body;

    if (!nombre || !email || !password || !tienda) {
      return res.render('registro', {
        titulo: 'Registro',
        error: 'Completa todos los campos.'
      });
    }

    if (!passwordValida(password)) {
      return res.render('registro', {
        titulo: 'Registro',
        error: 'La contraseña debe tener mínimo 8 caracteres, una mayúscula, un número y un carácter especial.'
      });
    }

    const existe = await Usuario.findOne({
      email: email.toLowerCase()
    });

    if (existe) {
      return res.render('registro', {
        titulo: 'Registro',
        error: 'El correo ya está registrado.'
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await Usuario.create({
      nombre,
      email: email.toLowerCase(),
      password: passwordHash,
      tienda,
      rol: ['administrador', 'gerente', 'empleado', 'auditor'].includes(rol)
        ? rol
        : 'empleado',
      proveedor: 'local'
    });

    res.render('login', {
      titulo: 'Iniciar sesión',
      exito: 'Usuario registrado correctamente. Ya puedes iniciar sesión.'
    });

  } catch (error) {
    console.error('ERROR REGISTRO:', error);

    res.status(500).render('registro', {
      titulo: 'Registro',
      error: 'No se pudo registrar el usuario.'
    });
  }
};

exports.login = async (req, res) => {
  try {
    const {
      email,
      password
    } = req.body;

    const usuario = await Usuario.findOne({
      email: email.toLowerCase()
    });

    if (!usuario || usuario.proveedor !== 'local') {
      return res.render('login', {
        titulo: 'Iniciar sesión',
        error: 'Credenciales incorrectas.'
      });
    }

    if (usuario.bloqueado) {
      return res.render('login', {
        titulo: 'Iniciar sesión',
        error: 'La cuenta está bloqueada por 5 intentos fallidos.'
      });
    }

    const coincide = await bcrypt.compare(
      password,
      usuario.password
    );

    if (!coincide) {
      usuario.intentosFallidos += 1;

      if (usuario.intentosFallidos >= 5) {
        usuario.bloqueado = true;
      }

      await usuario.save();

      const restantes = Math.max(
        0,
        5 - usuario.intentosFallidos
      );

      return res.render('login', {
        titulo: 'Iniciar sesión',
        error: usuario.bloqueado
          ? 'La cuenta ha sido bloqueada después de 5 intentos fallidos.'
          : `Credenciales incorrectas. Intentos restantes: ${restantes}.`
      });
    }

    usuario.intentosFallidos = 0;
    await usuario.save();

    await prepararMFA(usuario, req);

    req.session.save(() => {
      res.redirect('/mfa');
    });

  } catch (error) {
    console.error('ERROR LOGIN:', error);

    res.status(500).render('login', {
      titulo: 'Iniciar sesión',
      error: 'Error al iniciar sesión.'
    });
  }
};

exports.oauthCorrecto = async (req, res) => {
  try {
    const usuario = req.user;

    await prepararMFA(usuario, req);

    req.session.save(() => {
      res.redirect('/mfa');
    });

  } catch (error) {
    console.error('ERROR OAUTH:', error);

    res.status(500).render('error', {
      titulo: 'Error',
      mensaje: 'No se pudo iniciar la verificación MFA.'
    });
  }
};

exports.verificarMFA = async (req, res) => {
  try {
    const {
      codigo
    } = req.body;

    const usuario = await Usuario.findById(
      req.session.mfaUsuarioId
    );

    if (!usuario) {
      return res.redirect('/login');
    }

    if (usuario.intentosMFA >= 3) {
      req.session.mfaUsuarioId = null;

      return res.render('login', {
        titulo: 'Iniciar sesión',
        error: 'Se alcanzó el máximo de 3 intentos MFA.'
      });
    }

    if (
      !usuario.expiracionMFA ||
      usuario.expiracionMFA < new Date()
    ) {
      req.session.mfaUsuarioId = null;

      return res.render('login', {
        titulo: 'Iniciar sesión',
        error: 'El código MFA expiró. Inicia sesión nuevamente.'
      });
    }

    const correcto = await bcrypt.compare(
      codigo,
      usuario.codigoMFA || ''
    );

    if (!correcto) {
      usuario.intentosMFA += 1;

      await usuario.save();

      const restantes = Math.max(
        0,
        3 - usuario.intentosMFA
      );

      return res.render('mfa', {
        titulo: 'Verificación MFA',
        error: `Código incorrecto. Intentos restantes: ${restantes}.`
      });
    }

    usuario.codigoMFA = null;
    usuario.expiracionMFA = null;
    usuario.intentosMFA = 0;

    await usuario.save();

    req.session.mfaUsuarioId = null;

    const token = generarToken(usuario);

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 2 * 60 * 60 * 1000
    });

    res.redirect('/dashboard');

  } catch (error) {
    console.error('ERROR MFA:', error);

    res.status(500).render('mfa', {
      titulo: 'Verificación MFA',
      error: 'No se pudo validar el código.'
    });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token');

  req.session.destroy(() => {
    res.redirect('/login');
  });
};