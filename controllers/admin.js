const Product = require("../models/product");

exports.getAddProduct = (req, res, next) => {
  res.render("admin/edit-product", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    editing: false,
  });
};

exports.getEditProduct = (req, res, next) => {
  const prodId = req.params.productId;
  console.log(prodId);
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect("/");
  }

  Product.fetchById(prodId, (prod) => {
    if (!prod) return res.redirect("/");
    res.render("admin/edit-product", {
      pageTitle: "Edit Product",
      path: "/admin/edit-product",
      editing: editMode,
      product: prod,
    });
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const description = req.body.description;
  const price = req.body.price;
  const prod = new Product(null, title, imageUrl, description, price);
  prod
    .save()
    .then(() => {
      res.redirect("/");
    })
    .catch((err) => console.log(err));
};

exports.getProducts = (req, res, next) => {
  Product.fetchAll((products) => {
    res.render("admin/products", {
      prods: products,
      pageTitle: "Admin Products",
      path: "/admin/products",
    });
  });
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const prod = new Product(
    prodId,
    req.body.title,
    req.body.imageUrl,
    req.body.description,
    req.body.price
  );
  prod.save();
  res.redirect("/admin/products");
};

exports.postDeleteProduct = (req, res, next) => {
  Product.deleteById(req.body.productId, () => {
    res.redirect("/admin/products");
  });
};
