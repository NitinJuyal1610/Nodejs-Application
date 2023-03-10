const express = require("express");
const path = require("path");

const app = express();

const db = require("./util/database");

const { engine } = require("express-handlebars");
//set the view engine
// app.set("view engine", "pug");
app.set("view engine", "ejs");
// app.engine(
//   "hbs",
//   engine({
//     extname: "hbs",
//     defaultLayout: "main-layout",
//     layoutsDir: "views/layouts/",
//   })
// );
// app.set("view engine", "hbs");
//A directory or an array of directories for the application's views.
app.set("views", "views");

const bodyParser = require("body-parser");

const productsController = require("./controllers/errors");
const adminRoutes = require("./routes/admin");
const shopRouter = require("./routes/shop");

app.use(express.static(path.join(__dirname, "public")));
//registering a parser as a middleware
app.use(bodyParser.urlencoded());
app.use("/admin", adminRoutes);
app.use(shopRouter);

app.use(productsController.get404);

app.listen(3000);
