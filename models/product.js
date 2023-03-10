const fs = require("fs");
const dirname = require("../util/path");
const path = require("path");

const p = path.join(dirname, "data", "products.json");
const Cart = require("./cart");
const getProductsFromFile = (cb) => {
  fs.readFile(p, (err, file) => {
    if (!err) {
      cb(JSON.parse(file));
    } else cb([]);
  });
};
module.exports = class Product {
  constructor(id, title, imageUrl, description, price) {
    this.id = id;
    this.title = title;
    this.imageUrl = imageUrl;
    this.description = description;
    this.price = price;
  }

  save() {
    //get the path of the directory of data storage
    //reading if file already present
    getProductsFromFile((products) => {
      if (this.id) {
        const existingProductIndex = products.findIndex(
          (prod) => prod.id === this.id
        );
        const updatedProducts = [...products];
        updatedProducts[existingProductIndex] = this;

        //write the file by adding products in json form
        fs.writeFile(p, JSON.stringify(updatedProducts), (err) => {
          console.log(err);
        });
      }
      //assign a new id
      else {
        this.id = Math.random().toString();
        products.push(this);
        //write the file by adding products in json form
        fs.writeFile(p, JSON.stringify(products), (err) => {
          console.log(err);
        });
      }
    });
  }

  static fetchAll(cb) {
    getProductsFromFile(cb);
  }

  static fetchById(id, cb) {
    getProductsFromFile((products) => {
      const product = products.find((prod) => prod.id === id);
      cb(product);
    });
  }

  static deleteById(id, cb) {
    getProductsFromFile((products) => {
      const existingProductIndex = products.findIndex((prod) => prod.id === id);
      const prodPrice = products[existingProductIndex].price;
      products.splice(existingProductIndex, 1);
      fs.writeFile(p, JSON.stringify(products), (err) => {
        if (!err) {
          //delete from cart too
          Cart.deleteProduct(id, prodPrice);
          cb();
        }
      });
    });
  }
};
