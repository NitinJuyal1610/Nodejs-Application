const express = require('express');
const adminController = require('../controllers/admin');
const { check, body } = require('express-validator');
const router = express.Router();
const isAuth = require('../middleware/is-auth');
//middleware to add product
router.get('/add-product', isAuth, adminController.getAddProduct);
router.post(
  '/add-product',
  [
    check('title').isString().isLength({ min: 3 }).trim(),
    body('imageUrl').isURL().withMessage('Enter a valid image URL').trim(),
    body('price').isFloat().withMessage('Enter a valid price').trim(),
    body('description')
      .isLength({ min: 5, max: 400 })
      .withMessage('Description should have length atleast 5')
      .trim(),
  ],
  isAuth,
  adminController.postAddProduct,
);
router.get('/products', isAuth, adminController.getProducts);
router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);
router.post(
  '/edit-product',
  [
    check('title').isString().isLength({ min: 3 }).trim(),
    body('imageUrl').isURL().withMessage('Enter a valid image URL').trim(),
    body('price').isFloat().withMessage('Enter a valid price').trim(),
    body('description')
      .isLength({ min: 5, max: 400 })
      .withMessage('Description should have length atleast 5')
      .trim(),
  ],
  isAuth,
  adminController.postEditProduct,
);
router.post('/delete-product', isAuth, adminController.postDeleteProduct);
module.exports = router;
