const { MongoClient } = require('mongodb');

let _db;

//exporting function for connecting to the DB
exports.mongoConnect = (cb) => {
  MongoClient.connect(
    'mongodb+srv://nj:4F9RKDSMGxeiT7zV@cluster0.qk2yilc.mongodb.net/shop?retryWrites=true&w=majority',
  )
    .then((client) => {
      console.log('Connected');
      _db = client.db();
      cb();
    })
    .catch((err) => {
      console.log(err);
      throw err;
    });
};

const getDb = () => {
  if (_db) {
    return _db;
  }
  throw 'No Database Found';
};

// exporting function to get the database after the connection

exports.getDb = getDb;
