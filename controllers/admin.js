const product = require('../models/product');
const Product = require('../models/product');
const fileHelper = require('../util/file');
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

exports.getEditProduct = async (req, res, next) => {
  const prodId = req.params.productId;
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }

  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else message = null;
  try {
    const prod = await Product.findById(prodId);

    if (!prod) return res.redirect('/');
    res.render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: editMode,
      product: prod,
      errorMessage: message,
      validationErrors: [],
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.postAddProduct = async (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const description = req.body.description;
  const price = req.body.price;

  if (!image) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasErrors: true,
      product: {
        title: title,
        price: price,
        description: description,
      },
      errorMessage: 'Attached file is not an image.',
      validationErrors: [],
    });
  }

  const imageUrl = image.path;
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
    title: title,
    price: price,
    description: description,
    imageUrl: imageUrl,
    userId: req.user._id,
  });

  try {
    await product.save();
    res.redirect('/admin/products');
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ userId: req.user._id });
    res.render('admin/products', {
      prods: products,
      pageTitle: 'Admin Products',
      path: '/admin/products',
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.postEditProduct = async (req, res, next) => {
  const prodId = req.body.productId;
  const title = req.body.title;
  const image = req.file;
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
        _id: prodId,
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }

  try {
    const product = await Product.findById(prodId);

    if (product.userId.toString() !== req.user._id.toString())
      res.redirect('/');
    product.title = title;
    if (image) {
      fileHelper.deleteFile(image.path);
      product.imageUrl = image.path;
    }
    product.description = description;
    product.price = price;
    await product.save();

    res.redirect('/admin/products');
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.deleteProduct = async (req, res, next) => {
  const prodId = req.params.productId;
  try {
    const product = await Product.findById(prodId);

    if (!product) {
      return next(new Error('Product Not find'));
    }
    fileHelper.deleteFile(product.imageUrl);
    const result = await Product.deleteOne({
      _id: prodId,
      userId: req.user._id,
    });

    console.log('Deleted the Product');
    res.status(200).json({ message: 'Success!' });
  } catch (err) {
    res.status(500).json({
      message: 'Deleting product failed. ',
    });
  }
};
