const express = require('express');
const authController = require('../controllers/auth');
const { check, body } = require('express-validator');
const router = express.Router();
const User = require('../models/user');

router.get(
  '/login',
  [
    check('email').isEmail().withMessage('Please Enter a valid Email !').trim(),
    body('password', 'Please enter a valid password')
      .isLength({ min: 5 })
      .isAlphanumeric(),
  ],
  authController.getLogin,
);
router.get('/reset', authController.getReset);
router.post('/reset', authController.postReset);
router.get('/reset/:token', authController.getNewPassword);
router.post(
  '/login',
  [check('email').isEmail().withMessage('Please Enter a valid Email !')],
  authController.postLogin,
);
router.post('/logout', authController.postLogout);
router.get('/signup', authController.getSignup);
router.post(
  '/signup',

  //email and password validation
  [
    check('email')
      .isEmail()
      .withMessage('Please Enter a valid Email !')
      .custom(async (value, { req }) => {
        const userDoc = await User.findOne({ email: value });
        if (userDoc) {
          return Promise.reject('Email already exists , pick a different one.');
        }
      })
      .trim(),
    body(
      'password',
      'Please enter a password with only numbers and text and at least 5 characters',
    )
      .isLength({ min: 5 })
      .isAlphanumeric(),

    body('confirmPassword')
      .custom((value, { req }) => {
        if (value === req.body.password) return true;
        throw new Error('Password need to match !');
      })
      .trim(),
  ],
  authController.postSignup,
);
router.post('/new-password', authController.postNewPassword);
module.exports = router;
