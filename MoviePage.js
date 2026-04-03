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