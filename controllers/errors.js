exports.get404 = (req, res, next) => {
  res.render('404', {
    pageTitle: '404',
    path: 'Error',
  });
};

exports.get500 = (req, res, next) => {
  res.status(500).render('500', {
    pageTitle: 'Error!',
    path: '/500',
    isAuthenticated: req.session.isLoggedIn,
  });
};
