const fs = require("fs");
const path = require("path");
const dirname = require("../util/path");
const p = path.join(dirname, "data", "cart.json");
module.exports = class cart {
  static addProduct(id, productPrice) {
    fs.readFile(p, (err, fileContent) => {
      let cart = { products: [], totalPrice: 0 };
      if (!err) {
        cart = JSON.parse(fileContent);
      }

      const existingProductIndex = cart.products.findIndex(
        (prod) => prod.id == id
      );
      let updatedProduct;
      const existingProduct = cart.products[existingProductIndex];
      if (existingProduct) {
        updatedProduct = { ...existingProduct };
        updatedProduct.qty = updatedProduct.qty + 1;
        cart.products[existingProductIndex] = updatedProduct;
      } else {
        updatedProduct = { id: id, qty: 1 };
        cart.products = [...cart.products, updatedProduct];
      }

      cart.totalPrice = cart.totalPrice + Number(productPrice);
      fs.writeFile(p, JSON.stringify(cart), (err) => {
        console.log(err);
      });
    });
  }
  static deleteProduct(id, prodPrice) {
    fs.readFile(p, (err, fileContent) => {
      if (!err) {
        const updatedCart = { ...JSON.parse(fileContent) };
        console.log(updatedCart.products);
        const product = updatedCart.products.find((prod) => prod.id == id);
        if (!product) return;
        const productQty = product.qty;
        updatedCart.products = updatedCart.products.filter(
          (prod) => prod.id != id
        );
        updatedCart.totalPrice =
          updatedCart.totalPrice - prodPrice * productQty;

        fs.writeFile(p, JSON.stringify(updatedCart), (err) => {
          console.log(err);
        });
      }
    });
  }

  static getCart(cb) {
    fs.readFile(p, (err, fileContent) => {
      const cart = JSON.parse(fileContent);
      if (err) {
        cb(null);
      } else cb(cart);
    });
  }
};
