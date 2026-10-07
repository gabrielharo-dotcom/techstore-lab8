const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;

const Usuario = require('../models/Usuario');

module.exports = function configurarPassport(passport) {

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {

      const usuario = await Usuario.findById(id);

      done(null, usuario);

    } catch (error) {

      done(error, null);

    }
  });

  if (
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET
  ) {

    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GOOGLE_CALLBACK_URL
        },

        async (
          accessToken,
          refreshToken,
          profile,
          done
        ) => {

          try {

            const email =
              profile.emails?.[0]?.value?.toLowerCase();

            console.log(
              'EMAIL GOOGLE:',
              email
            );

            let usuario =
              await Usuario.findOne({
                $or: [
                  {
                    proveedor: 'google',
                    proveedorId: profile.id
                  },

                  ...(email
                    ? [
                        {
                          email: email
                        }
                      ]
                    : [])
                ]
              });

            if (!usuario) {

              usuario =
                await Usuario.create({
                  nombre:
                    profile.displayName ||
                    'Usuario Google',

                  email:
                    email ||
                    `google_${profile.id}@techstore.local`,

                  tienda:
                    'Sin asignar',

                  rol:
                    'empleado',

                  proveedor:
                    'google',

                  proveedorId:
                    profile.id
                });

            } else {

              if (!usuario.proveedorId) {

                usuario.proveedor =
                  'google';

                usuario.proveedorId =
                  profile.id;

                await usuario.save();

              }

            }

            done(
              null,
              usuario
            );

          } catch (error) {

            console.error(
              'ERROR GOOGLE:',
              error
            );

            done(
              error,
              null
            );

          }

        }
      )
    );

  }

  if (
    process.env.GITHUB_CLIENT_ID &&
    process.env.GITHUB_CLIENT_SECRET
  ) {

    passport.use(
      new GitHubStrategy(
        {
          clientID:
            process.env.GITHUB_CLIENT_ID,

          clientSecret:
            process.env.GITHUB_CLIENT_SECRET,

          callbackURL:
            process.env.GITHUB_CALLBACK_URL,

          scope: [
            'user:email'
          ]
        },

        async (
          accessToken,
          refreshToken,
          profile,
          done
        ) => {

          try {

            const email =
              profile.emails?.[0]?.value?.toLowerCase();

            console.log(
              'EMAIL GITHUB:',
              email
            );

            if (!email) {

              console.log(
                'GitHub no devolvió un correo electrónico.'
              );

              return done(
                new Error(
                  'GitHub no proporcionó un correo electrónico.'
                ),
                null
              );

            }

            let usuario =
              await Usuario.findOne({
                $or: [
                  {
                    proveedor:
                      'github',

                    proveedorId:
                      profile.id
                  },

                  {
                    email:
                      email
                  }
                ]
              });

            if (!usuario) {

              usuario =
                await Usuario.create({
                  nombre:
                    profile.displayName ||
                    profile.username ||
                    'Usuario GitHub',

                  email:
                    email,

                  tienda:
                    'Sin asignar',

                  rol:
                    'empleado',

                  proveedor:
                    'github',

                  proveedorId:
                    profile.id
                });

            } else {

              usuario.email =
                email;

              usuario.proveedor =
                'github';

              usuario.proveedorId =
                profile.id;

              await usuario.save();

            }

            done(
              null,
              usuario
            );

          } catch (error) {

            console.error(
              'ERROR GITHUB:',
              error
            );

            done(
              error,
              null
            );

          }

        }
      )
    );

  }

};