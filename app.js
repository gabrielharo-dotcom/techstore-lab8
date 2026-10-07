require('dotenv').config();
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
const { engine } = require('express-handlebars');

const conectarDB = require('./config/database');
const configurarPassport = require('./config/passport');
const autenticar = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const productoRoutes = require('./routes/productos');

const app = express();
conectarDB();
configurarPassport(passport);

app.engine('hbs', engine({
  extname: '.hbs',
  defaultLayout: false,
  helpers: {
    eq: (a, b) => a === b,
    or: (...args) => {
      args.pop();
      return args.some(Boolean);
    }
  }
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'techstore_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' }
}));
app.use(passport.initialize());
app.use(passport.session());

app.use(authRoutes);
app.use('/productos', productoRoutes);

app.get('/', (req, res) => res.redirect('/login'));

app.get('/dashboard', autenticar, (req, res) => {
  res.render('dashboard', { titulo: 'Panel principal', usuario: req.usuario });
});

app.use((req, res) => {
  res.status(404).render('error', { titulo: '404', mensaje: 'Página no encontrada.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor iniciado en http://localhost:${PORT}`));
