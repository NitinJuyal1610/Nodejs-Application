const express = require('express');
const path = require('path');
const app = express();
app.set('view engine', 'ejs');
app.set('views', 'views');
const bodyParser = require('body-parser');

const errorsController = require('./controllers/errors');
const adminRoutes = require('./routes/admin');
const shopRouter = require('./routes/shop');
const User = require('./models/user');

const { mongoConnect } = require('./util/database');

app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded());
app.use((req, res, next) => {
  User.findById('642f159ae388ca2f9c45135e')
    .then((user) => {
      req.user = new User(user.name, user.email, user.cart, user._id);
      next();
    })
    .catch((err) => console.log(err));
});
app.use('/admin', adminRoutes);
app.use(shopRouter);
app.use(errorsController.get404);

mongoConnect((client) => {
  app.listen(3000);
});
