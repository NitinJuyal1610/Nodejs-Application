const Product = require('../models/product');
const Order = require('../models/orders');
const path = require('path');
const PDFDocument = require('pdfkit');
require('dotenv').config();
const stripe = require('stripe')(`${process.env.STRIPE_KEY}`);

const ITEMS_PER_PAGE = 1;
let totalItems;
const fs = require('fs');
exports.getProducts = async (req, res, next) => {
  const page = +req.query.page || 1;

  try {
    const num = await Product.find().countDocuments();
    totalItems = num;
    const result = await Product.find()
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);

    res.render('shop/product-list', {
      path: '/products',
      pageTitle: 'All Products',
      prods: result,
      totalProducts: totalItems,
      hasNextPage: ITEMS_PER_PAGE * page < totalItems,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      currentPage: page,
      previousPage: page - 1,
      lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getProduct = async (req, res, next) => {
  const prodId = req.params.productId;
  try {
    const result = await Product.findById(prodId);
    res.render('shop/product-detail', {
      product: result,
      path: '/products',
      pageTitle: 'Details',
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getIndex = async (req, res, next) => {
  const page = +req.query.page || 1;

  try {
    const num = await Product.find().countDocuments();
    totalItems = num;
    const result = await Product.find()
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);

    res.render('shop/index', {
      path: '/',
      pageTitle: 'Shop',
      prods: result,
      totalProducts: totalItems,
      hasNextPage: ITEMS_PER_PAGE * page < totalItems,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      currentPage: page,
      previousPage: page - 1,
      lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getCart = async (req, res, next) => {
  try {
    const user = await req.user.populate('cart.items.productId');

    res.render('shop/cart', {
      path: '/cart',
      pageTitle: 'Your Cart',
      products: user.cart.items,
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ 'user.userId': req.user._id });
    res.render('shop/orders', {
      path: '/orders',
      pageTitle: 'Your Orders',
      orders: orders,
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getLogin = (req, res, next) => {
  res.send('login here');
};

// exports.getCheckout = (req, res, next) => {
//   res.render("shop/checkout", {
//     path: "/checkout",
//     pageTitle: "Checkout",
//   });
// };

exports.postCart = async (req, res, next) => {
  const prodId = req.body.productId;
  try {
    const product = await Product.findById(prodId);

    await req.user.addToCart(product);

    res.redirect('/cart');
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.postCartDeleteProduct = async (req, res, next) => {
  const prodId = req.body.productId;
  try {
    await req.user.deleteCartItem(prodId);
    res.redirect('/cart');
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.postOrder = async (req, res, next) => {
  try {
    const user = await req.user.populate('cart.items.productId');
    const products = user.cart.items.map((item) => {
      return {
        productData: { ...item.productId._doc },
        quantity: item.quantity,
      };
    });

    const order = new Order({
      products: products,
      user: {
        userId: req.user._id,
        email: req.user.email,
      },
    });
    await order.save();
    req.user.cart = { items: [] };
    await req.user.save();
    res.redirect('/orders');
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getInvoice = async (req, res, next) => {
  const orderId = req.params.orderId;
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      return next(new Error('Order Not Found !'));
    }
    const userId = req.user._id;
    if (order.user.userId.toString() != userId.toString()) {
      return next(new Error('Not your order !'));
    }

    const invoiceName = 'invoice-' + orderId + '.pdf';
    const invoicePath = path.join('data', 'invoices', invoiceName);
    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(invoicePath));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'inline; filename="' + invoiceName + '"',
    );
    doc.pipe(res);
    doc.fontSize(24).text('Invoice', {
      underline: true,
    });
    doc.text(
      '-------------------------------------------------------------------',
    );

    let totalPrice = 0;
    order.products.forEach((product) => {
      totalPrice += product.quantity * product.productData.price;
      doc
        .fontSize(14)
        .text(
          product.productData.title +
            ' -- ' +
            product.quantity +
            ' x ' +
            ' $' +
            product.productData.price,
        );
    });

    doc.fontSize(18).text('Total Price : ' + totalPrice);
    doc.end();
  } catch (err) {
    next(new Error(err));
  }
};

exports.getCheckout = async (req, res, next) => {
  let products;
  let total = 0;
  try {
    const user = await req.user.populate('cart.items.productId');

    products = user.cart.items;
    total = 0;
    products.forEach((p) => {
      total += p.quantity * p.productId.price;
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: products.map((p) => {
        return {
          price_data: {
            product_data: {
              name: p.productId.title,
              description: p.productId.description,
            },
            unit_amount: p.productId.price * 100,
            currency: 'usd',
          },
          quantity: p.quantity,
        };
      }),

      success_url: req.protocol + '://' + req.get('host') + '/checkout/success',
      cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel',
    });

    res.render('shop/checkout', {
      path: 'checkout',
      pageTitle: 'Checkout',
      products: products,
      totalSum: total,
      sessionId: session.id,
    });
  } catch (err) {
    return next(new Error(err));
  }
};

exports.getCheckoutSuccess = async (req, res, next) => {
  try {
    const user = await req.user.populate('cart.items.productId');

    const products = user.cart.items.map((item) => {
      return {
        productData: { ...item.productId._doc },
        quantity: item.quantity,
      };
    });

    const order = new Order({
      products: products,
      user: {
        userId: req.user._id,
        email: req.user.email,
      },
    });
    await order.save();

    req.user.cart = { items: [] };
    await req.user.save();

    res.redirect('/orders');
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};
