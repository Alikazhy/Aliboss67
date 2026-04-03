import React, { useState } from "react";

export default function Auth({ onRegister, onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      alert("Заполни все поля");
      return;
    }

    if (isLogin) {
      onLogin(email, password);
    } else {
      onRegister(email, password);
    }
  };

  return (
    <div className="auth-wrapper">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1 className="auth-title">AITU cinema</h1>
        <p className="auth-subtitle">
          {isLogin ? "Вход в аккаунт" : "Регистрация"}
        </p>

        <input
          className="auth-input"
          type="email"
          placeholder="Введите email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="auth-input"
          type="password"
          placeholder="Введите пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="primary-btn auth-btn" type="submit">
          {isLogin ? "Войти" : "Зарегистрироваться"}
        </button>

        <button
          className="switch-btn"
          type="button"
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin
            ? "Нет аккаунта? Зарегистрироваться"
            : "Уже есть аккаунт? Войти"}
        </button>
      </form>
    </div>
  );
}