import React from "react";
import { Link } from "react-router-dom";

function MovieList({ movies = [], favorites = [], toggleFavorite, imageBaseUrl }) {
  if (!Array.isArray(movies)) {
    return <p style={{ color: "white" }}>Фильмы не найдены</p>;
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: "24px",
        marginTop: "30px",
      }}
    >
      {movies.map((movie) => {
        if (!movie) return null;

        const isFavorite = Array.isArray(favorites)
          ? favorites.some((fav) => fav && fav.id === movie.id)
          : false;

        const poster = movie.poster_path
          ? `${imageBaseUrl}${movie.poster_path}`
          : "https://via.placeholder.com/500x750?text=No+Image";

        return (
          <div
            key={movie.id}
            style={{
              background: "#0d1b3d",
              borderRadius: "18px",
              overflow: "hidden",
              color: "white",
              boxShadow: "0 10px 25px rgba(0,0,0,0.35)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <img
              src={poster}
              alt={movie.title || "Фильм"}
              style={{
                width: "100%",
                height: "390px",
                objectFit: "cover",
              }}
            />

            <div style={{ padding: "18px" }}>
              <h3 style={{ marginBottom: "10px", fontSize: "24px" }}>
                {movie.title || "Без названия"}
              </h3>

              <p
                style={{
                  color: "#cbd5e1",
                  fontSize: "15px",
                  lineHeight: "1.5",
                  minHeight: "70px",
                }}
              >
                {movie.overview
                  ? `${movie.overview.slice(0, 120)}...`
                  : "Описание отсутствует"}
              </p>

              <p style={{ margin: "12px 0", color: "#facc15", fontWeight: "bold" }}>
                ⭐ {movie.vote_average ?? 0}
              </p>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <Link
                  to={`/movie/${movie.id}`}
                  style={{
                    textDecoration: "none",
                    background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
                    color: "white",
                    padding: "10px 16px",
                    borderRadius: "10px",
                    fontWeight: "bold",
                  }}
                >
                  Подробнее
                </Link>

                <button
                  onClick={() => toggleFavorite(movie)}
                  style={{
                    background: isFavorite ? "#e11d48" : "#1e293b",
                    color: "white",
                    border: "none",
                    padding: "10px 16px",
                    borderRadius: "10px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
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

export default MovieList;