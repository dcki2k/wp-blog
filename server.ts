/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;
const DB_PATH = path.join(process.cwd(), "posts-db.json");

// Middleware to parse JSON payloads
app.use(express.json());

// Ensure database file exists
function readPosts() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading database posts. Falling back to default list:", error);
  }
  return [];
}

function writePosts(posts: any[]) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(posts, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Error writing network posts database:", error);
    return false;
  }
}

// API Routes
// 1. GET posts list
app.get("/api/posts", (req, res) => {
  const posts = readPosts();
  res.json(posts);
});

// 2. GET individual post
app.get("/api/posts/:id", (req, res) => {
  const posts = readPosts();
  const post = posts.find((p: any) => p.id === req.params.id);
  if (post) {
    res.json(post);
  } else {
    res.status(404).json({ error: "Post not found" });
  }
});

// 3. POST create or overwrite post
app.post("/api/posts", (req, res) => {
  const { id, title, summary, content, author, tags, widgetType } = req.body;
  if (!id || !title || !content) {
    return res.status(400).json({ error: "id, title, and content are required fields." });
  }

  const posts = readPosts();
  const existingIndex = posts.findIndex((p: any) => p.id === id);

  const newPost = {
    id,
    title,
    summary: summary || "Network article detailing troubleshooting, design or protocol updates.",
    content,
    author: author || "Network Engineer Specialist",
    createdAt: new Date().toISOString(),
    tags: tags || ["General"],
    widgetType: widgetType || "none",
  };

  if (existingIndex !== -1) {
    posts[existingIndex] = newPost;
  } else {
    posts.unshift(newPost); // Add at the start of the blog post listing
  }

  const success = writePosts(posts);
  if (success) {
    res.status(201).json(newPost);
  } else {
    res.status(500).json({ error: "Could not save database updates." });
  }
});

// 4. DELETE post
app.delete("/api/posts/:id", (req, res) => {
  const posts = readPosts();
  const filtered = posts.filter((p: any) => p.id !== req.params.id);
  const success = writePosts(filtered);
  if (success) {
    res.json({ message: "Post deleted successfully" });
  } else {
    res.status(500).json({ error: "Failed to persist database deletions." });
  }
});

// Vite Middleware Setup for Development environment, and static fallback for production
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Express with Vite Development Server...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving build outputs in production environment...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`NetWP Network Engineering Portal live at http://localhost:${PORT}`);
  });
}

setupVite().catch((error) => {
  console.error("Vite server initialization error:", error);
});
