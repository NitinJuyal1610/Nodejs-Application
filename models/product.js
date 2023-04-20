const { getDb } = require('../util/database');
const { ObjectId } = require('mongodb');
class Product {
  constructor(title, price, description, imageUrl, id, userId) {
    this.title = title;
    this.price = price;
    this.description = description;
    this.imageUrl = imageUrl;
    this._id = id ? new ObjectId(id) : null;
    this.userId = userId;
  }

  save() {
    const db = getDb();
    let dbOp;
    if (this._id) {
      //update
      dbOp = db
        .collection('products')
        .updateOne({ _id: new ObjectId(this._id) }, { $set: this });
    } else {
      dbOp = db
        .collection('products')
        .insertOne(this)
        .then((res) => console.log(res))
        .catch((err) => console.log(err));
    }
    return dbOp;
  }

  static fetchAll() {
    const db = getDb();
    return db
      .collection('products')
      .find()
      .toArray()
      .then((res) => res)
      .catch((err) => console.log(err));
  }

  static findById(prodId) {
    const db = getDb();
    return db
      .collection('products')
      .find({ _id: new ObjectId(prodId) })
      .next()
      .then((product) => product)
      .catch((err) => console.log(err));
  }

  static deleteById(prodId) {
    const db = getDb();
    return db
      .collection('products')
      .deleteOne({ _id: new ObjectId(prodId) })
      .then((res) => console.log('Deleted'))
      .catch((err) => console.log(err));
  }
}

module.exports = Product;
