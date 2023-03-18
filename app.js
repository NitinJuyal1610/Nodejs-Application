const express = require('express');
const path = require('path');

const app = express();

const sequelize = require('./util/database');

app.set('view engine', 'ejs');
app.set('views', 'views');

const bodyParser = require('body-parser');
const productsController = require('./controllers/errors');

const adminRoutes = require('./routes/admin');
const shopRouter = require('./routes/shop');
const User = require('./models/user');
const Product = require('./models/product');
const Cart = require('./models/cart');
const CartItem = require('./models/cart-item');
const Order = require('./models/order');
const OrderItem = require('./models/order-item');
app.use(express.static(path.join(__dirname, 'public')));
//registering a parser as a middleware
app.use(bodyParser.urlencoded());
app.use((req, res, next) => {
  User.findByPk(1)
    .then((user) => {
      req.user = user;
      next();
    })
    .catch((err) => console.log(err));
});
app.use('/admin', adminRoutes);
app.use(shopRouter);
app.use(productsController.get404);

Product.belongsTo(User, { constraints: true, onDelete: 'CASCADE' });
User.hasMany(Product);
User.hasOne(Cart);
Cart.belongsTo(User);
Cart.belongsToMany(Product, { through: CartItem });
Product.belongsToMany(Cart, { through: CartItem });
Order.belongsTo(User);
User.hasMany(Order);
Order.belongsToMany(Product, { through: OrderItem });

sequelize
  // .sync({ force: true })
  .sync()
  .then((res) => {
    return User.findByPk(1);
  })
  .then((user) => {
    if (!user) {
      return User.create({ name: 'Max', email: 'test@test.com' });
    }
    return Promise.resolve(user);
  })
  .then((user) => {
    return user.createCart();
  })
  .then((user) => {
    app.listen(3000);
  })
  .catch((err) => console.log(err));
