const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const axios = require("axios");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

let db;

async function initDb() {
  db = await open({
    filename: path.join(__dirname, "database.sqlite"),
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      banned INTEGER DEFAULT 0,
      name TEXT DEFAULT '',
      bio TEXT DEFAULT '',
      city TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      favorites TEXT DEFAULT '[]',
      history TEXT DEFAULT '[]',
      notes TEXT DEFAULT '[]',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const adminEmail = "admin@gmail.com";
  const existingAdmin = await db.get("SELECT * FROM users WHERE email = ?", [adminEmail]);

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("admin123", 10);

    await db.run(
      `
      INSERT INTO users (
        email, password, role, banned, name, bio, city, avatar, favorites, history, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        adminEmail,
        hashedPassword,
        "admin",
        0,
        "Администратор",
        "Главный администратор платформы",
        "Astana",
        "https://ui-avatars.com/api/?name=Admin&background=111827&color=fff&size=256",
        "[]",
        "[]",
        "[]",
      ]
    );

    console.log("Админ создан: admin@gmail.com / admin123");
  }

  console.log("SQLite подключена ✅");
}

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function parseUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    password: user.password,
    role: user.role,
    banned: Boolean(user.banned),
    profile: {
      name: user.name || "",
      bio: user.bio || "",
      city: user.city || "",
      avatar: user.avatar || "",
    },
    favorites: safeJsonParse(user.favorites, []),
    history: safeJsonParse(user.history, []),
    notes: safeJsonParse(user.notes, []),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function sanitizeUser(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}

function createToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || "supersecretkey",
    { expiresIn: "7d" }
  );
}

async function getUserById(id) {
  const user = await db.get("SELECT * FROM users WHERE id = ?", [id]);
  return parseUser(user);
}

async function getUserByEmail(email) {
  const user = await db.get("SELECT * FROM users WHERE email = ?", [email]);
  return parseUser(user);
}

async function saveUserData(user) {
  await db.run(
    `
    UPDATE users
    SET
      role = ?,
      banned = ?,
      name = ?,
      bio = ?,
      city = ?,
      avatar = ?,
      favorites = ?,
      history = ?,
      notes = ?,
      updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?
    `,
    [
      user.role,
      user.banned ? 1 : 0,
      user.profile?.name || "",
      user.profile?.bio || "",
      user.profile?.city || "",
      user.profile?.avatar || "",
      JSON.stringify(user.favorites || []),
      JSON.stringify(user.history || []),
      JSON.stringify(user.notes || []),
      user.id,
    ]
  );
}

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Нет токена" });
    }

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "supersecretkey");

    const user = await getUserById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "Пользователь не найден" });
    }

    if (user.banned) {
      return res.status(403).json({ message: "Ваш аккаунт заблокирован" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Неверный токен" });
  }
};

app.get("/", (req, res) => {
  res.send("API работает 🚀");
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Заполни email и пароль" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await getUserByEmail(normalizedEmail);

    if (existingUser) {
      return res.status(400).json({ message: "Пользователь уже существует" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const username = normalizedEmail.split("@")[0];

    const role = normalizedEmail === "admin@gmail.com" ? "admin" : "user";
    const name = normalizedEmail === "admin@gmail.com" ? "Администратор" : username;
    const bio =
      normalizedEmail === "admin@gmail.com" ? "Главный администратор платформы" : "";
    const city = normalizedEmail === "admin@gmail.com" ? "Astana" : "";
    const avatar =
      normalizedEmail === "admin@gmail.com"
        ? "https://ui-avatars.com/api/?name=Admin&background=111827&color=fff&size=256"
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(
            username
          )}&background=7c3aed&color=fff&size=256`;

    const result = await db.run(
      `
      INSERT INTO users (
        email, password, role, banned, name, bio, city, avatar, favorites, history, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        normalizedEmail,
        hashedPassword,
        role,
        0,
        name,
        bio,
        city,
        avatar,
        "[]",
        "[]",
        "[]",
      ]
    );

    const user = await getUserById(result.lastID);
    const token = createToken(user);

    res.status(201).json({
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.log("REGISTER ERROR:", error);
    res.status(500).json({ message: "Ошибка регистрации" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Заполни email и пароль" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await getUserByEmail(normalizedEmail);

    if (!user) {
      return res.status(400).json({ message: "Неверный email или пароль" });
    }

    if (user.banned) {
      return res.status(403).json({ message: "Ваш аккаунт заблокирован" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Неверный email или пароль" });
    }

    const token = createToken(user);

    res.json({
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.log("LOGIN ERROR:", error);
    res.status(500).json({ message: "Ошибка входа" });
  }
});

app.get("/api/profile/me", auth, async (req, res) => {
  res.json(sanitizeUser(req.user));
});

app.put("/api/profile", auth, async (req, res) => {
  try {
    const { name, bio, city, avatar } = req.body;

    req.user.profile = {
      ...req.user.profile,
      ...(name !== undefined && { name }),
      ...(bio !== undefined && { bio }),
      ...(city !== undefined && { city }),
      ...(avatar !== undefined && { avatar }),
    };

    await saveUserData(req.user);

    const updatedUser = await getUserById(req.user.id);
    res.json(sanitizeUser(updatedUser));
  } catch (error) {
    console.log("PROFILE UPDATE ERROR:", error);
    res.status(500).json({ message: "Ошибка сохранения профиля" });
  }
});

app.get("/api/favorites", auth, async (req, res) => {
  res.json(req.user.favorites || []);
});

app.post("/api/favorites/toggle", auth, async (req, res) => {
  try {
    const movie = req.body;

    if (!movie || !movie.id) {
      return res.status(400).json({ message: "Фильм не передан" });
    }

    const exists = req.user.favorites.some((fav) => String(fav.id) === String(movie.id));

    if (exists) {
      req.user.favorites = req.user.favorites.filter(
        (fav) => String(fav.id) !== String(movie.id)
      );
    } else {
      req.user.favorites = [movie, ...req.user.favorites];
    }

    await saveUserData(req.user);
    res.json(req.user.favorites);
  } catch (error) {
    console.log("FAVORITES ERROR:", error);
    res.status(500).json({ message: "Ошибка избранного" });
  }
});

app.delete("/api/favorites", auth, async (req, res) => {
  try {
    req.user.favorites = [];
    await saveUserData(req.user);
    res.json([]);
  } catch (error) {
    console.log("FAVORITES CLEAR ERROR:", error);
    res.status(500).json({ message: "Ошибка очистки избранного" });
  }
});

app.get("/api/history", auth, async (req, res) => {
  res.json(req.user.history || []);
});

app.post("/api/history", auth, async (req, res) => {
  try {
    const movie = req.body;

    if (!movie || !movie.id) {
      return res.status(400).json({ message: "Фильм не передан" });
    }

    const preparedMovie = {
      ...movie,
      viewedAt: new Date().toISOString(),
    };

    const withoutDuplicate = (req.user.history || []).filter(
      (item) => String(item.id) !== String(movie.id)
    );

    req.user.history = [preparedMovie, ...withoutDuplicate].slice(0, 20);

    await saveUserData(req.user);
    res.json(req.user.history);
  } catch (error) {
    console.log("HISTORY ERROR:", error);
    res.status(500).json({ message: "Ошибка истории" });
  }
});

app.delete("/api/history", auth, async (req, res) => {
  try {
    req.user.history = [];
    await saveUserData(req.user);
    res.json([]);
  } catch (error) {
    console.log("HISTORY CLEAR ERROR:", error);
    res.status(500).json({ message: "Ошибка очистки истории" });
  }
});

app.get("/api/notes", auth, async (req, res) => {
  res.json(req.user.notes || []);
});

app.post("/api/notes", auth, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Текст заметки пустой" });
    }

    const newNote = {
      id: Date.now(),
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };

    req.user.notes = [newNote, ...(req.user.notes || [])];

    await saveUserData(req.user);

    res.status(201).json(req.user.notes);
  } catch (error) {
    console.log("NOTES CREATE ERROR:", error);
    res.status(500).json({ message: "Ошибка создания заметки" });
  }
});

app.delete("/api/notes/:id", auth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    req.user.notes = (req.user.notes || []).filter((note) => Number(note.id) !== id);

    await saveUserData(req.user);
    res.json(req.user.notes);
  } catch (error) {
    console.log("NOTES DELETE ERROR:", error);
    res.status(500).json({ message: "Ошибка удаления заметки" });
  }
});

app.delete("/api/notes", auth, async (req, res) => {
  try {
    req.user.notes = [];
    await saveUserData(req.user);
    res.json([]);
  } catch (error) {
    console.log("NOTES CLEAR ERROR:", error);
    res.status(500).json({ message: "Ошибка очистки заметок" });
  }
});

app.get("/api/movies/:id/trailer", async (req, res) => {
  try {
    const movieId = req.params.id;

    if (!movieId) {
      return res.status(400).json({ message: "ID фильма не передан" });
    }

    if (!process.env.TMDB_API_KEY) {
      return res.status(500).json({ message: "TMDB_API_KEY не найден в .env" });
    }

    const response = await axios.get(
      `https://api.themoviedb.org/3/movie/${movieId}/videos`,
      {
        params: {
          api_key: process.env.TMDB_API_KEY,
          language: "ru-RU",
        },
      }
    );

    const videos = response.data.results || [];

    const trailer =
      videos.find((video) => video.site === "YouTube" && video.type === "Trailer") ||
      videos.find((video) => video.site === "YouTube") ||
      null;

    if (!trailer) {
      return res.json({
        success: true,
        trailer: null,
        message: "Трейлер не найден",
      });
    }

    return res.json({
      success: true,
      trailer: {
        id: trailer.id,
        key: trailer.key,
        name: trailer.name,
        site: trailer.site,
        type: trailer.type,
        official: trailer.official,
        published_at: trailer.published_at,
        youtubeUrl: `https://www.youtube.com/watch?v=${trailer.key}`,
        embedUrl: `https://www.youtube.com/embed/${trailer.key}`,
      },
    });
  } catch (error) {
    console.log("TRAILER ERROR:", error.response?.data || error.message);
    res.status(500).json({ message: "Ошибка загрузки трейлера" });
  }
});

const PORT = process.env.PORT || 5000;

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Сервер запущен на порту ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Ошибка запуска SQLite:", error);
  });