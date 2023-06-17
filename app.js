const express = require('express');
const path = require('path');
const app = express();
const csrf = require('csurf');
require('dotenv').config();
const https = require('https');
const mongoose = require('mongoose');
const errorsController = require('./controllers/errors');
const adminRoutes = require('./routes/admin');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const shopRouter = require('./routes/shop');
const bodyParser = require('body-parser');
const User = require('./models/user');
const multer = require('multer');
const session = require('express-session');
const mongoDbStore = require('connect-mongodb-session')(session);
const flash = require('connect-flash');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const fs = require('fs');

app.set('view engine', 'ejs');
app.set('views', 'views');
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(bodyParser.urlencoded());
app.use(cookieParser('secret'));

const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.qk2yilc.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}?retryWrites=true&w=majority`;

const store = new mongoDbStore({
  uri: MONGODB_URI,
  collection: 'sessions',
});

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'access.log'),
  { flags: 'a' },
);

app.use(morgan('combined', { stream: accessLogStream }));
app.use(helmet());
app.use(compression());

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'images');
  },
  filename: function (req, file, cb) {
    cb(null, new Date().toISOString().replace(/:/g, '-') + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(multer({ storage: storage, fileFilter: fileFilter }).single('image'));

const csrfProtection = csrf();

const privateKey = fs.readFileSync('server.key');
const certificate = fs.readFileSync('server.cert');

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
app.use(async (req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  try {
    //error handling to be done in this code snippet
    const user = await User.findById(req.session.user._id);

    if (!user) return next();
    //mongoose model user
    req.user = user;
    next();
  } catch (err) {
    next(new Error(err));
  }
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
  console.log(error);
  res.redirect('/500');
});

mongoose
  .connect(MONGODB_URI)
  .then((res) => {
    console.log('Connected');
    app.listen(process.env.PORT || 3000);
  })
  .catch((err) => console.log(err));
