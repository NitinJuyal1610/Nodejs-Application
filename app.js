const express = require('express');
const path = require('path');
const app = express();
const csrf = require('csurf');
const mongoose = require('mongoose');
const errorsController = require('./controllers/errors');
const adminRoutes = require('./routes/admin');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const shopRouter = require('./routes/shop');
const bodyParser = require('body-parser');
const User = require('./models/user');
const session = require('express-session');
const mongoDbStore = require('connect-mongodb-session')(session);
const flash = require('connect-flash');
app.use(cookieParser('secret'));
const MONGODB_URI =
  'mongodb+srv://nj:gRaVWaT0CL1FDB4k@cluster0.qk2yilc.mongodb.net/shop?retryWrites=true&w=majority';
const store = new mongoDbStore({
  uri: MONGODB_URI,
  collection: 'sessions',
});

app.set('view engine', 'ejs');
app.set('views', 'views');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded());

const csrfProtection = csrf();

app.use(
  session({
    secret: 'nitinjuyal',
    resave: false,
    saveUninitialized: false,
    store: store,
  }),
);

app.use(flash());
app.use(csrfProtection);
app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }

  //error handling to be done in this code snippet
  User.findById(req.session.user._id)
    .then((user) => {
      if (!user) return next();
      //mongoose model user
      req.user = user;
      next();
    })
    .catch((err) => {
      next(new Error(err));
    });
});

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use('/admin', adminRoutes);
app.use(shopRouter);
app.use(authRoutes);
app.use('/500', errorsController.get500);
app.use(errorsController.get404);
app.use((error, req, res, next) => {
  res.redirect('/500');
});

mongoose
  .connect(MONGODB_URI)
  .then((res) => {
    console.log('Connected');
    app.listen(3000);
  })
  .catch((err) => console.log(err));
