const express = require('express');
const passport = require('passport');
const router = express.Router();

const authController = require('../controllers/authController');

router.get('/registro', authController.verRegistro);
router.post('/registro', authController.registrar);

router.get('/login', authController.verLogin);
router.post('/login', authController.login);

router.get('/mfa', authController.verMFA);
router.post('/mfa', authController.verificarMFA);

router.get('/logout', authController.logout);

router.get(
  '/auth/google',

  (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(503).render('error', {
        titulo: 'Google OAuth',
        mensaje: 'Google OAuth no está configurado en .env.'
      });
    }

    next();
  },

  passport.authenticate('google', {
    scope: [
      'profile',
      'email'
    ]
  })
);

router.get(
  '/auth/google/callback',

  passport.authenticate('google', {
    failureRedirect: '/login'
  }),

  authController.oauthCorrecto
);

router.get(
  '/auth/github',

  (req, res, next) => {
    if (!process.env.GITHUB_CLIENT_ID) {
      return res.status(503).render('error', {
        titulo: 'GitHub OAuth',
        mensaje: 'GitHub OAuth no está configurado en .env.'
      });
    }

    next();
  },

  passport.authenticate('github', {
    scope: [
      'user:email'
    ]
  })
);

router.get(
  '/auth/github/callback',

  passport.authenticate('github', {
    failureRedirect: '/login'
  }),

  authController.oauthCorrecto
);

module.exports = router;