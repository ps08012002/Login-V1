import express from "express";
import session from "express-session";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";

const app = express();
const db = new PrismaClient();

const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
};
app.use(cors(corsOptions));

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "http://localhost:3000"],
    },
  })
);
// bikin __dirname karena pakai ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(
  session({
    secret: "d3Xtanta?",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // pakai true kalau sudah HTTPS
  })
);

// serve login page (public)
app.use(express.static(path.join(__dirname, "../frontend")));

// ---------------- Middleware Proteksi ----------------
function isAuthenticated(req, res, next) {
  if (req.session.user) return next();
  return res.redirect("/login.html");
}

function isAdmin(req, res, next) {
  if (req.session.user?.role === "ADMIN") return next();
  return res.status(403).send("Akses ditolak, bukan admin");
}

// ---------------- API ----------------

app.post("/api/create", async (req, res) => {
  const cari = await db.tb_user.findFirst({
    where: { username: req.body.username },
  });
  if (cari) {
    return res.status(401).json(" data sudah ada");
  } else {
    await db.tb_user.create({
      data: {
        username: req.body.username,
        password: req.body.password,
        role: req.body.role,
      },
    });
    res.json("sukses insert");
  }
});

// Login
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await db.tb_user.findFirst({ where: { username: username } });

  if (!user || user.password !== password) {
    return res.status(401).json({ message: "Username atau password salah" });
  }

  req.session.user = { id: user.id, role: user.role };
  res.json({ message: "Login berhasil", role: user.role });
});

// Logout
app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ message: "Logout berhasil" });
  });
});

// Dashboard User (proteksi)
app.get("/user", isAuthenticated, (req, res) => {
  if (req.session.user.role !== "USER") {
    return res.status(403).send("Hanya untuk user");
  }
  res.sendFile(path.join(__dirname, "../frontend/user.html"));
});

// Dashboard Admin (proteksi)
app.get("/admin", isAuthenticated, isAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/admin.html"));
});
app.listen(3000, () => {
  console.log("Running Completed");
  console.log("Serving static from:", path.join(__dirname, "../frontend"));
});
