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

// const { mongoConnect } = require('./util/database');
const mongoose = require('mongoose');
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded());
app.use((req, res, next) => {
  User.findById('64415ebcf5bd3d626dcc4f5e')
    .then((user) => {
      req.user = user;
      next();
    })
    .catch((err) => console.log(err));
});
app.use('/admin', adminRoutes);
app.use(shopRouter);
app.use(errorsController.get404);

mongoose
  .connect(
    'mongodb+srv://nj:4F9RKDSMGxeiT7zV@cluster0.qk2yilc.mongodb.net/shop?retryWrites=true&w=majority',
  )
  .then((res) => {
    User.findOne().then((user) => {
      if (!user) {
        const user = new User({
          name: 'Nitin',
          email: 'nitinjuyal1610@gmail.com',
          cart: {
            items: [],
          },
        });

        user.save();
      }
    });

    app.listen(3000);
  })
  .catch((err) => console.log(err));
