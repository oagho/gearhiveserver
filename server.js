const express = require("express");
const cors = require("cors");
const multer = require("multer");
const Joi = require("joi");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.static("public"));
app.use(express.json());
app.use(cors());
app.use("/images", express.static(path.join(__dirname, "public/images")));

// ✅ Multer config to upload images to /public/images/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/images/");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

// ✅ Load existing products from products.json
let products = [];
const productsPath = path.join(__dirname, "products.json");

try {
  const data = fs.readFileSync(productsPath, "utf-8");
  const fileData = JSON.parse(data);

  // ✅ Load plain array or { products: [...] }
  if (Array.isArray(fileData)) {
    products = fileData;
  } else if (Array.isArray(fileData.products)) {
    products = fileData.products;
  } else {
    console.warn("⚠️ Invalid products.json format. Starting with empty array.");
    products = [];
  }
} catch (err) {
  console.warn("⚠️ Could not read products.json. Starting with empty array.");
  products = [];
}

// ✅ GET all products
app.get("/api/products", (req, res) => {
  res.json({ products });
});

// ✅ PUT update a product
app.put("/api/products/:id", upload.single("image"), (req, res) => {
  const product = products.find((p) => p._id === parseInt(req.params.id));
  if (!product) {
    return res.status(404).send("Product not found");
  }

  const result = validateProduct(req.body);
  if (result.error) {
    return res.status(400).send(result.error.details[0].message);
  }

  product.name = req.body.name;
  product.price = parseFloat(req.body.price);
  product.category = req.body.category || "General";
  if (req.file) {
    product.image = `/images/${req.file.filename}`;
  }

  fs.writeFileSync(productsPath, JSON.stringify(products, null, 2), "utf-8");

  res.status(200).json(product);
});

// ✅ DELETE a product
app.delete("/api/products/:id", (req, res) => {
  const productIndex = products.findIndex(
    (p) => p._id === parseInt(req.params.id)
  );
  if (productIndex === -1) {
    return res.status(404).send("Product not found");
  }

  const deleted = products.splice(productIndex, 1)[0];

  fs.writeFileSync(productsPath, JSON.stringify(products, null, 2), "utf-8");

  res.status(200).json(deleted);
});

// ✅ POST a new product
app.post("/api/products", upload.single("image"), (req, res) => {
  const result = validateProduct(req.body);
  if (result.error) {
    return res.status(400).send(result.error.details[0].message);
  }

  const newProduct = {
    _id: products.length + 1,
    name: req.body.name,
    price: parseFloat(req.body.price),
    category: req.body.category || "General",
    image: `/images/${req.file.filename}`,
  };

  products.push(newProduct);

  fs.writeFileSync(productsPath, JSON.stringify(products, null, 2), "utf-8");

  res.status(201).json(newProduct);
});

// ✅ Joi validation schema
const validateProduct = (product) => {
  const schema = Joi.object({
    _id: Joi.allow(""),
    name: Joi.string().min(3).required(),
    price: Joi.number().min(0).required(),
    category: Joi.string().allow("").optional(),
    image: Joi.allow(""),
  });

  return schema.validate(product);
};

// ✅ Start the server
app.listen(3001, () => {
  console.log("🚀 Product server listening on http://localhost:3001");
});
