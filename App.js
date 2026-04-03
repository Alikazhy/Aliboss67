import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  BrowserRouter as Router,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useParams,
} from "react-router-dom";
import "./App.css";

const API_KEY = "85c6a7823150fff678a16785fbd1b2ac";
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_URL = "https://image.tmdb.org/t/p/w500";
const FALLBACK_POSTER = "https://via.placeholder.com/500x750?text=No+Image";
const BACKEND_URL = "http://localhost:5000";

function getToken() {
  return localStorage.getItem("token");
}

async function apiRequest(path, options = {}) {
  const token = getToken();

  const response = await fetch(`${BACKEND_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Ошибка сервера");
  }

  return data;
}

function getPoster(path) {
  return path ? `${IMAGE_URL}${path}` : FALLBACK_POSTER;
}

function Auth({ onLogin, onRegister }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      alert("Заполни email и пароль");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email.trim())) {
      alert("Введи корректный email");
      return;
    }

    if (!isLogin && password.length < 6) {
      alert("Пароль должен быть минимум 6 символов");
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      alert("Пароли не совпадают");
      return;
    }

    if (isLogin) {
      onLogin(email, password);
    } else {
      onRegister(email, password);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand-title">
          <span className="brand-icon">🎬</span>
          <h1>AITU Cinema</h1>
        </div>

        <p className="auth-subtitle">
          {isLogin
            ? "Войди в аккаунт и управляй своей кино-библиотекой"
            : "Создай аккаунт и начни собирать любимые фильмы"}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Введите email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Введите пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {!isLogin && (
            <input
              type="password"
              placeholder="Повтори пароль"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          )}

          <button type="submit" className="primary-btn auth-main-btn">
            {isLogin ? "Войти" : "Зарегистрироваться"}
          </button>
        </form>

        <button
          className="text-switch-btn"
          onClick={() => {
            setIsLogin(!isLogin);
            setConfirmPassword("");
          }}
        >
          {isLogin
            ? "Нет аккаунта? Зарегистрироваться"
            : "Уже есть аккаунт? Войти"}
        </button>

        <div className="demo-admin-box">
          <p>Тестовый админ:</p>
          <span>admin@gmail.com / admin123</span>
        </div>
      </div>
    </div>
  );
}

function Header({
  currentUser,
  favoritesCount,
  historyCount,
  notesCount,
  onLogout,
}) {
  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path ? "nav-link active-link" : "nav-link";

  return (
    <header className="app-header">
      <div className="logo-block">
        <div className="brand-title">
          <span className="brand-icon">🎬</span>
          <h1>AITU Cinema</h1>
        </div>

        <p className="welcome-text">
          Добро пожаловать,{" "}
          <strong>{currentUser?.profile?.name || currentUser?.email}</strong>
        </p>

        <p className="role-text">
          Роль:{" "}
          <span>
            {currentUser?.role === "admin" ? "Администратор" : "Пользователь"}
          </span>
        </p>
      </div>

      <div className="header-actions">
        <Link to="/" className={isActive("/")}>
          Главная
        </Link>
        <Link to="/favorites" className={isActive("/favorites")}>
          Избранное ({favoritesCount})
        </Link>
        <Link to="/history" className={isActive("/history")}>
          История ({historyCount})
        </Link>
        <Link to="/notes" className={isActive("/notes")}>
          Заметки ({notesCount})
        </Link>
        <Link to="/profile" className={isActive("/profile")}>
          Профиль
        </Link>
        <button className="logout-btn" onClick={onLogout}>
          Выйти
        </button>
      </div>
    </header>
  );
}

function DashboardCards({ favorites, history, notes, currentUser }) {
  const averageRating = useMemo(() => {
    if (!favorites.length) return 0;
    const sum = favorites.reduce(
      (acc, movie) => acc + (movie.vote_average || 0),
      0
    );
    return (sum / favorites.length).toFixed(1);
  }, [favorites]);

  const lastViewed = history[0];

  return (
    <div className="dashboard-grid">
      <div className="mini-card">
        <h3>Избранное</h3>
        <p>{favorites.length}</p>
        <span>сохранённых фильмов</span>
      </div>

      <div className="mini-card">
        <h3>История</h3>
        <p>{history.length}</p>
        <span>просмотренных страниц</span>
      </div>

      <div className="mini-card">
        <h3>Заметки</h3>
        <p>{notes.length}</p>
        <span>личных записей</span>
      </div>

      <div className="mini-card">
        <h3>Средний рейтинг</h3>
        <p>{averageRating}</p>
        <span>по избранным фильмам</span>
      </div>

      <div className="mini-card wide-card">
        <h3>Аккаунт</h3>
        <p>{currentUser?.profile?.name || "Пользователь"}</p>
        <span>{currentUser?.email}</span>
      </div>

      <div className="mini-card wide-card">
        <h3>Последний просмотр</h3>
        <p>{lastViewed?.title || "Пока пусто"}</p>
        <span>
          {lastViewed?.viewedAt
            ? new Date(lastViewed.viewedAt).toLocaleString()
            : "Открой карточку фильма"}
        </span>
      </div>
    </div>
  );
}

function QuickActions({
  favorites,
  history,
  notes,
  setFavorites,
  setHistory,
  setNotes,
}) {
  const clearFavorites = async () => {
    if (!favorites.length) return;
    if (!window.confirm("Очистить избранное?")) return;

    try {
      const updated = await apiRequest("/api/favorites", {
        method: "DELETE",
      });
      setFavorites(updated);
    } catch (error) {
      alert(error.message);
    }
  };

  const clearHistory = async () => {
    if (!history.length) return;
    if (!window.confirm("Очистить историю просмотров?")) return;

    try {
      const updated = await apiRequest("/api/history", {
        method: "DELETE",
      });
      setHistory(updated);
    } catch (error) {
      alert(error.message);
    }
  };

  const clearNotes = async () => {
    if (!notes.length) return;
    if (!window.confirm("Удалить все заметки?")) return;

    try {
      const updated = await apiRequest("/api/notes", {
        method: "DELETE",
      });
      setNotes(updated);
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <section className="section-card">
      <div className="section-header">
        <div>
          <h2>Быстрые действия</h2>
          <p>Полезные кнопки для управления аккаунтом</p>
        </div>
      </div>

      <div className="quick-actions-grid">
        <button className="small-btn purple-btn quick-btn" onClick={clearFavorites}>
          Очистить избранное
        </button>
        <button className="small-btn gray-btn quick-btn" onClick={clearHistory}>
          Очистить историю
        </button>
        <button className="small-btn red-btn quick-btn" onClick={clearNotes}>
          Очистить заметки
        </button>
      </div>
    </section>
  );
}

function SearchBar({ search, setSearch, onSearch, onReset }) {
  return (
    <div className="search-row">
      <input
        className="search-input"
        type="text"
        placeholder="Поиск фильма..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSearch();
        }}
      />
      <button className="primary-btn" onClick={onSearch}>
        Найти
      </button>
      <button className="secondary-btn" onClick={onReset}>
        Сбросить
      </button>
    </div>
  );
}

function MovieList({ movies = [], favorites = [], toggleFavorite }) {
  if (!movies.length) {
    return (
      <div className="empty-box">
        <h3>Ничего не найдено</h3>
        <p>Попробуй другой запрос или открой популярные фильмы.</p>
      </div>
    );
  }

  return (
    <div className="movies-grid">
      {movies.map((movie) => {
        if (!movie || !movie.id) return null;

        const isFavorite = favorites.some((fav) => fav && fav.id === movie.id);

        return (
          <div className="movie-card" key={movie.id}>
            <img
              src={getPoster(movie.poster_path)}
              alt={movie.title || "Фильм"}
              className="movie-poster"
            />

            <div className="movie-content">
              <h3 className="movie-title">{movie.title || "Без названия"}</h3>

              <p className="movie-description">
                {movie.overview
                  ? `${movie.overview.slice(0, 120)}...`
                  : "Описание отсутствует"}
              </p>

              <div className="movie-meta">
                <span className="rating">⭐ {movie.vote_average ?? 0}</span>
                <span className="release-year">
                  {movie.release_date ? movie.release_date.slice(0, 4) : "—"}
                </span>
              </div>

              <div className="movie-actions">
                <Link to={`/movie/${movie.id}`} className="details-btn">
                  Подробнее
                </Link>

                <button
                  className={isFavorite ? "favorite-btn active-favorite" : "favorite-btn"}
                  onClick={() => toggleFavorite(movie)}
                >
                  {isFavorite ? "♥ В избранном" : "♡ В избранное"}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FavoritesPage({ favorites, toggleFavorite }) {
  return (
    <section className="section-card">
      <div className="section-header">
        <div>
          <h2>Избранные фильмы</h2>
          <p>Здесь собраны фильмы, которые ты сохранил</p>
        </div>
      </div>

      <MovieList
        movies={favorites}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
      />
    </section>
  );
}

function HistoryPage({ history, favorites, toggleFavorite }) {
  return (
    <section className="section-card">
      <div className="section-header">
        <div>
          <h2>История просмотров</h2>
          <p>Последние фильмы, которые ты открывал</p>
        </div>
      </div>

      {!history.length ? (
        <div className="empty-box">
          <h3>История пока пустая</h3>
          <p>Открой страницу любого фильма, и он появится здесь.</p>
        </div>
      ) : (
        <MovieList
          movies={history}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
        />
      )}
    </section>
  );
}

function NotesPage({ notes, setNotes }) {
  const [text, setText] = useState("");

  const addNote = async () => {
    if (!text.trim()) return;

    try {
      const updated = await apiRequest("/api/notes", {
        method: "POST",
        body: JSON.stringify({ text }),
      });

      setNotes(updated);
      setText("");
    } catch (error) {
      alert(error.message);
    }
  };

  const deleteNote = async (id) => {
    try {
      const updated = await apiRequest(`/api/notes/${id}`, {
        method: "DELETE",
      });

      setNotes(updated);
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <section className="section-card">
      <div className="section-header">
        <div>
          <h2>Личные заметки</h2>
          <p>Записывай фильмы, которые хочешь посмотреть позже</p>
        </div>
      </div>

      <div className="notes-box">
        <textarea
          className="note-input"
          placeholder="Например: посмотреть Интерстеллар на выходных..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="primary-btn" onClick={addNote}>
          Добавить заметку
        </button>
      </div>

      {!notes.length ? (
        <div className="empty-box">
          <h3>Заметок пока нет</h3>
          <p>Создай первую заметку для своего списка просмотра.</p>
        </div>
      ) : (
        <div className="notes-list">
          {notes.map((note) => (
            <div className="note-card" key={note.id}>
              <p>{note.text}</p>
              <div className="note-footer">
                <span>{new Date(note.createdAt).toLocaleString()}</span>
                <button
                  className="small-btn red-btn"
                  onClick={() => deleteNote(note.id)}
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ProfilePage({ currentUser, setCurrentUser }) {
  const [form, setForm] = useState({
    name: currentUser?.profile?.name || "",
    bio: currentUser?.profile?.bio || "",
    city: currentUser?.profile?.city || "",
    avatar: currentUser?.profile?.avatar || "",
  });

  useEffect(() => {
    setForm({
      name: currentUser?.profile?.name || "",
      bio: currentUser?.profile?.bio || "",
      city: currentUser?.profile?.city || "",
      avatar: currentUser?.profile?.avatar || "",
    });
  }, [currentUser]);

  const handleSave = async () => {
    try {
      const updatedUser = await apiRequest("/api/profile", {
        method: "PUT",
        body: JSON.stringify(form),
      });

      setCurrentUser(updatedUser);
      alert("Профиль сохранён");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <section className="section-card">
      <div className="section-header">
        <div>
          <h2>Профиль пользователя</h2>
          <p>Редактируй личные данные аккаунта</p>
        </div>
      </div>

      <div className="profile-layout">
        <div className="profile-preview">
          <img
            src={form.avatar || FALLBACK_POSTER}
            alt="Аватар"
            className="profile-avatar"
          />
          <h3>{form.name || "Без имени"}</h3>
          <p>{currentUser.email}</p>
          <span>{currentUser.role === "admin" ? "Администратор" : "Пользователь"}</span>
        </div>

        <div className="profile-form">
          <input
            type="text"
            placeholder="Имя"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            type="text"
            placeholder="Город"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
          <input
            type="text"
            placeholder="Ссылка на аватар"
            value={form.avatar}
            onChange={(e) => setForm({ ...form, avatar: e.target.value })}
          />
          <textarea
            placeholder="О себе"
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
          <button className="primary-btn" onClick={handleSave}>
            Сохранить профиль
          </button>
        </div>
      </div>
    </section>
  );
}

function MoviePage({ favorites = [], toggleFavorite, addToHistory, currentUser }) {
  const { id } = useParams();

  const [movie, setMovie] = useState(null);
  const [trailer, setTrailer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trailerLoading, setTrailerLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=ru-RU`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.status_message || "Ошибка загрузки фильма");
        }

        setMovie(data);
        addToHistory(data);
      } catch (error) {
        setError("Не удалось загрузить информацию о фильме");
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id, addToHistory]);

  useEffect(() => {
    const fetchTrailer = async () => {
      try {
        setTrailerLoading(true);
        const data = await apiRequest(`/api/movies/${id}/trailer`);

        if (data.success && data.trailer) {
          setTrailer(data.trailer);
        } else {
          setTrailer(null);
        }
      } catch (error) {
        console.log("TRAILER ERROR:", error.message);
        setTrailer(null);
      } finally {
        setTrailerLoading(false);
      }
    };

    if (id) {
      fetchTrailer();
    }
  }, [id]);

  const isFavorite = favorites.some((fav) => fav && fav.id === Number(id));

  if (loading) {
    return <div className="page-message">Загрузка...</div>;
  }

  if (error) {
    return <div className="page-message">{error}</div>;
  }

  if (!movie) {
    return <div className="page-message">Фильм не найден</div>;
  }

  return (
    <div className="movie-page">
      <Link to="/" className="back-link">
        ← Назад
      </Link>

      <div className="movie-page-card">
        <img
          src={getPoster(movie.poster_path)}
          alt={movie.title || "Фильм"}
          className="movie-page-poster"
        />

        <div className="movie-page-info">
          <h1>{movie.title || "Без названия"}</h1>
          <p className="movie-page-rating">⭐ Рейтинг: {movie.vote_average ?? 0}</p>
          <p className="movie-page-date">
            <strong>Дата выхода:</strong> {movie.release_date || "Не указана"}
          </p>
          <p className="movie-page-date">
            <strong>Пользователь:</strong>{" "}
            {currentUser?.profile?.name || currentUser?.email}
          </p>
          <p className="movie-page-overview">
            {movie.overview || "Описание отсутствует"}
          </p>

          <button
            className={isFavorite ? "favorite-btn active-favorite" : "favorite-btn"}
            onClick={() => toggleFavorite(movie)}
          >
            {isFavorite ? "♥ Убрать из избранного" : "♡ Добавить в избранное"}
          </button>
        </div>
      </div>

      <div className="section-card" style={{ marginTop: "24px" }}>
        <div className="section-header">
          <div>
            <h2>Трейлер</h2>
            <p>Официальный трейлер фильма</p>
          </div>
        </div>

        {trailerLoading ? (
          <div className="status-box">Загрузка трейлера...</div>
        ) : trailer ? (
          <div
            style={{
              width: "100%",
              overflow: "hidden",
              borderRadius: "18px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
            }}
          >
            <iframe
              width="100%"
              height="500"
              src={trailer.embedUrl}
              title={trailer.name || "Trailer"}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ display: "block", border: "none" }}
            />
          </div>
        ) : (
          <div className="status-box">Трейлер для этого фильма не найден</div>
        )}
      </div>
    </div>
  );
}

function MainHome({
  currentUser,
  movies,
  favorites,
  history,
  notes,
  search,
  setSearch,
  loadingMovies,
  movieError,
  fetchMovies,
  toggleFavorite,
  setFavorites,
  setHistory,
  setNotes,
}) {
  return (
    <>
      <section className="section-card">
        <div className="section-header">
          <div>
            <h2>Главная страница</h2>
            <p>Твой персональный кино-кабинет</p>
          </div>
        </div>

        <DashboardCards
          favorites={favorites}
          history={history}
          notes={notes}
          currentUser={currentUser}
        />
      </section>

      <QuickActions
        favorites={favorites}
        history={history}
        notes={notes}
        setFavorites={setFavorites}
        setHistory={setHistory}
        setNotes={setNotes}
      />

      <section className="section-card">
        <div className="section-header">
          <div>
            <h2>Каталог фильмов</h2>
            <p>Ищи фильмы и добавляй понравившиеся в избранное</p>
          </div>
        </div>

        <SearchBar
          search={search}
          setSearch={setSearch}
          onSearch={() => fetchMovies(search)}
          onReset={() => {
            setSearch("");
            fetchMovies("");
          }}
        />

        {loadingMovies && <div className="status-box">Загрузка фильмов...</div>}
        {movieError && <div className="status-box error-box">{movieError}</div>}
        {!loadingMovies && !movieError && (
          <MovieList
            movies={movies}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
          />
        )}
      </section>
    </>
  );
}

function MainApp() {
  const [currentUser, setCurrentUser] = useState(null);

  const [movies, setMovies] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [notes, setNotes] = useState([]);

  const [search, setSearch] = useState("");
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [movieError, setMovieError] = useState("");

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const user = await apiRequest("/api/profile/me");
        setCurrentUser(user);
      } catch (error) {
        localStorage.removeItem("token");
        setCurrentUser(null);
      }
    };

    bootstrap();
  }, []);

  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUser?.id) return;

      try {
        const [favoritesData, historyData, notesData] = await Promise.all([
          apiRequest("/api/favorites"),
          apiRequest("/api/history"),
          apiRequest("/api/notes"),
        ]);

        setFavorites(Array.isArray(favoritesData) ? favoritesData : []);
        setHistory(Array.isArray(historyData) ? historyData : []);
        setNotes(Array.isArray(notesData) ? notesData : []);
      } catch (error) {
        console.log(error.message);
      }
    };

    loadUserData();
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchMovies();
    }
  }, [currentUser]);

  const fetchMovies = async (query = "") => {
    try {
      setLoadingMovies(true);
      setMovieError("");

      const url = query.trim()
        ? `${BASE_URL}/search/movie?api_key=${API_KEY}&language=ru-RU&query=${encodeURIComponent(
            query
          )}`
        : `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=ru-RU&page=1`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.status_message || "Ошибка загрузки");
      }

      setMovies(data.results || []);
    } catch (error) {
      setMovieError("Не удалось загрузить фильмы");
      setMovies([]);
    } finally {
      setLoadingMovies(false);
    }
  };

  const handleRegister = async (email, password) => {
    try {
      const data = await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      localStorage.setItem("token", data.token);
      setCurrentUser(data.user);
      alert("Регистрация успешна");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLogin = async (email, password) => {
    try {
      const data = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      localStorage.setItem("token", data.token);
      setCurrentUser(data.user);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    setCurrentUser(null);
    setFavorites([]);
    setHistory([]);
    setNotes([]);
  };

  const toggleFavorite = async (movie) => {
    if (!movie?.id) return;

    try {
      const updatedFavorites = await apiRequest("/api/favorites/toggle", {
        method: "POST",
        body: JSON.stringify(movie),
      });

      setFavorites(updatedFavorites);
    } catch (error) {
      alert(error.message);
    }
  };

  const addToHistory = useCallback(async (movie) => {
    if (!movie?.id) return;

    try {
      const updatedHistory = await apiRequest("/api/history", {
        method: "POST",
        body: JSON.stringify(movie),
      });

      setHistory(updatedHistory);
    } catch (error) {
      console.log(error.message);
    }
  }, []);

  if (!currentUser) {
    return <Auth onLogin={handleLogin} onRegister={handleRegister} />;
  }

  return (
    <div className="app-shell">
      <Header
        currentUser={currentUser}
        favoritesCount={favorites.length}
        historyCount={history.length}
        notesCount={notes.length}
        onLogout={handleLogout}
      />

      <Routes>
        <Route
          path="/"
          element={
            <MainHome
              currentUser={currentUser}
              movies={movies}
              favorites={favorites}
              history={history}
              notes={notes}
              search={search}
              setSearch={setSearch}
              loadingMovies={loadingMovies}
              movieError={movieError}
              fetchMovies={fetchMovies}
              toggleFavorite={toggleFavorite}
              setFavorites={setFavorites}
              setHistory={setHistory}
              setNotes={setNotes}
            />
          }
        />

        <Route
          path="/favorites"
          element={
            <FavoritesPage favorites={favorites} toggleFavorite={toggleFavorite} />
          }
        />

        <Route
          path="/history"
          element={
            <HistoryPage
              history={history}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
            />
          }
        />

        <Route
          path="/notes"
          element={<NotesPage notes={notes} setNotes={setNotes} />}
        />

        <Route
          path="/profile"
          element={
            <ProfilePage
              currentUser={currentUser}
              setCurrentUser={setCurrentUser}
            />
          }
        />

        <Route
          path="/movie/:id"
          element={
            <MoviePage
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              addToHistory={addToHistory}
              currentUser={currentUser}
            />
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <MainApp />
    </Router>
  );
}