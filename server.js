const express = require("express");
const cors = require("cors");
const multer = require("multer");
const Joi = require("joi");
const path = require("path");
const mongoose = require("mongoose");

const app = express();
//mongode atlas password lZ2OVrsw81cxN0z0
// Middleware
app.use(express.static("public"));
app.use(express.json());
app.use(cors());
app.use("/images", express.static(path.join(__dirname, "public/images")));

// ✅ Connect to MongoDB Atlas
mongoose
  .connect(
    "mongodb+srv://gearhive-database:lZ2OVrsw81cxN0z0@gearhive.a8rzu8f.mongodb.net/gearhive?retryWrites=true&w=majority"
  )
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((error) => console.error("❌ MongoDB connection error:", error));

// ✅ Define Mongoose schema and model
const productSchema = new mongoose.Schema({
  name: { type: String, required: true, minlength: 3 },
  price: { type: Number, required: true, min: 0 },
  category: { type: String, default: "General" },
  image: { type: String, required: true },
});

const Product = mongoose.model("Product", productSchema);

// ✅ Multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "./public/images/"),
  filename: (req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage });

// ✅ Joi validation schema
const validateProduct = (product) => {
  const schema = Joi.object({
    name: Joi.string().min(3).required(),
    price: Joi.number().min(0).required(),
    category: Joi.string().allow("").optional(),
    image: Joi.allow(""), // Not checked by Joi as multer handles it
  });

  return schema.validate(product);
};

// ✅ Routes

// Get all products
app.get("/api/products", async (req, res) => {
  const products = await Product.find();
  console.log(products);
  res.json({ products });
});

// Add new product
app.post("/api/products", upload.single("image"), async (req, res) => {
  const result = validateProduct(req.body);
  if (result.error)
    return res.status(400).send(result.error.details[0].message);

  const newProduct = new Product({
    name: req.body.name,
    price: parseFloat(req.body.price),
    category: req.body.category || "General",
    image: `/images/${req.file.filename}`,
  });

  await newProduct.save();
  res.status(201).json(newProduct);
});

// Update a product
app.put("/api/products/:id", upload.single("image"), async (req, res) => {
  const result = validateProduct(req.body);
  if (result.error)
    return res.status(400).send(result.error.details[0].message);

  const updateData = {
    name: req.body.name,
    price: parseFloat(req.body.price),
    category: req.body.category || "General",
  };

  if (req.file) {
    updateData.image = `/images/${req.file.filename}`;
  }

  const updated = await Product.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
  });

  if (!updated) return res.status(404).send("Product not found");
  res.status(200).json(updated);
});

// Delete a product
app.delete("/api/products/:id", async (req, res) => {
  const deleted = await Product.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).send("Product not found");
  res.status(200).json(deleted);
});

// ✅ Start the server
app.listen(3001, () => {
  console.log("🚀 Product server listening on http://localhost:3001");
});
