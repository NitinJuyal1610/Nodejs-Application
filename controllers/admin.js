const product = require('../models/product');
const Product = require('../models/product');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
exports.getAddProduct = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else message = null;
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    hasErrors: false,
    errorMessage: message,
    validationErrors: [],
  });
};

exports.getEditProduct = (req, res, next) => {
  const prodId = req.params.productId;
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }

  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else message = null;

  Product.findById(prodId)
    .then((prod) => {
      if (!prod) return res.redirect('/');
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        editing: editMode,
        product: prod,
        errorMessage: message,
        validationErrors: [],
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const description = req.body.description;
  const price = req.body.price;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasErrors: true,
      product: {
        title: title,
        price: price,
        description: description,
        imageUrl: imageUrl,
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }
  const product = new Product({
    _id: new mongoose.Types.ObjectId('646d9cb913f11b73c3a0935c'),
    title: title,
    price: price,
    description: description,
    imageUrl: imageUrl,
    userId: req.user._id,
  });
  product
    .save()
    .then((results) => {
      res.status.redirect('/admin/products');
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProducts = (req, res, next) => {
  Product.find({ userId: req.user._id })
    // .select('title price -_id')
    // .populate('userId')
    .then((products) => {
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products',
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const description = req.body.description;
  const price = req.body.price;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: true,
      hasErrors: true,
      product: {
        title: title,
        price: price,
        description: description,
        imageUrl: imageUrl,
        _id: prodId,
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }

  Product.findById(prodId)
    .then((product) => {
      if (product.userId.toString() !== req.user._id.toString())
        res.redirect('/');
      product.title = title;
      product.imageUrl = imageUrl;
      product.description = description;
      product.price = price;
      return product.save();
    })
    .then((result) => {
      res.redirect('/admin/products');
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  Product.deleteOne({ _id: prodId, userId: req.user._id })
    .then((result) => {
      console.log(result);
      console.log('Deleted the Product');
      res.redirect('/admin/products');
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
