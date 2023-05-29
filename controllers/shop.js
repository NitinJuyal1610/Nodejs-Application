const Product = require('../models/product');
const Order = require('../models/orders');
const path = require('path');
const PDFDocument = require('pdfkit');
const stripe = require('stripe')(
  'sk_test_51NCmoDSHj1oUSKR5JGbxMBhWiAOPR1pKxJLQSk7GPg8M9ZG2G4eb0AwolKTuMsNqNzXDubIHggPfDmASnxzKXXWJ00YwJjpOIc',
);

const ITEMS_PER_PAGE = 1;
let totalItems;
const fs = require('fs');
exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  Product.find()
    .countDocuments()
    .then((num) => {
      totalItems = num;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((result) => {
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
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;

  Product.findById(prodId)
    .then((result) => {
      res.render('shop/product-detail', {
        product: result,
        path: '/products',
        pageTitle: 'Details',
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  Product.find()
    .countDocuments()
    .then((num) => {
      totalItems = num;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })

    .then((result) => {
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
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .then((user) => {
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: user.cart.items,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({ 'user.userId': req.user._id })

    .then((orders) => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
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

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then((product) => {
      return req.user.addToCart(product);
    })
    .then((result) => {
      res.redirect('/cart');
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .deleteCartItem(prodId)
    .then((result) => {
      res.redirect('/cart');
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .then((user) => {
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
      return order.save();
    })
    .then((result) => {
      req.user.cart = { items: [] };
      return req.user.save();
    })
    .then((result) => res.redirect('/orders'))
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
    .then((order) => {
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
    })
    .catch((err) => next(new Error(err)));
};

exports.getCheckout = (req, res, next) => {
  let products;
  let total = 0;
  req.user
    .populate('cart.items.productId')
    .then((user) => {
      products = user.cart.items;
      total = 0;
      products.forEach((p) => {
        total += p.quantity * p.productId.price;
      });

      return stripe.checkout.sessions.create({
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

        success_url:
          req.protocol + '://' + req.get('host') + '/checkout/success',
        cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel',
      });
    })
    .then((session) => {
      res.render('shop/checkout', {
        path: 'checkout',
        pageTitle: 'Checkout',
        products: products,
        totalSum: total,
        sessionId: session.id,
      });
    })
    .catch((err) => {
      return next(new Error(err));
    });
};

exports.getCheckoutSuccess = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .then((user) => {
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
      return order.save();
    })
    .then((result) => {
      req.user.cart = { items: [] };
      return req.user.save();
    })
    .then((result) => res.redirect('/orders'))
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
