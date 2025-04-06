import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { readFile } from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(
  cors({
    origin: "*", // You can specify your frontend domain instead of '*'
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Load product data from products.json
let products = [];
const loadProducts = async () => {
  try {
    const data = await readFile(path.join(__dirname, "products.json"), "utf8");
    products = JSON.parse(data);
    console.log("✅ Successfully loaded products");
  } catch (err) {
    console.error("❌ Error loading products.json:", err.message);
  }
};

// Initialize products on server start
loadProducts();

// API endpoint to get the list of products
app.get("/api/products", (req, res) => {
  try {
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(products, null, 2));
  } catch (err) {
    console.error("Error sending products:", err.message);
    res.status(500).json({ error: "Failed to load products" });
  }
});

// API endpoint to get a specific product by ID
app.get("/api/products/:id", (req, res) => {
  const productId = parseInt(req.params.id);
  const product = products.find((p) => p.id === productId);
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ error: "Product not found" });
  }
});

// Catch-all route to serve index.html for SPA
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
