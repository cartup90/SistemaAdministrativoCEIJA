// src/components/Auth.jsx
import React, { useState } from "react";
import { LogIn, Calendar, AlertCircle, ArrowLeft } from "lucide-react";
import { login, isMock } from "../firebase";

export default function Auth({ onLoginSuccess, onBackToPublic }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError("Por favor, complete todos los campos.");
      setLoading(false);
      return;
    }

    try {
      const user = await login(email, password);
      onLoginSuccess(user);
    } catch (err) {
      console.error(err);
      setError("Credenciales incorrectas. Verifique el correo y la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="flex-center animate-fade-in"
      style={{
        minHeight: "100vh",
        padding: "1.5rem",
        background: "radial-gradient(circle at center, rgba(99, 102, 241, 0.15) 0%, transparent 70%)"
      }}
    >
      <div 
        className="glass-card" 
        style={{
          width: "100%",
          maxWidth: "440px",
          padding: "2.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem"
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "0.5rem" }}>
          <h1 
            style={{ 
              fontFamily: "var(--font-family-title)",
              fontSize: "2.2rem",
              fontWeight: 800,
              background: "linear-gradient(135deg, #fff 30%, var(--text-muted) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: "0.25rem"
            }}
          >
            SisGest
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            CEIJA N° 12 — Anexo Alberdi
          </p>
        </div>

        {isMock && (
          <div 
            style={{ 
              background: "rgba(99, 102, 241, 0.08)", 
              border: "1px dashed rgba(99, 102, 241, 0.3)", 
              borderRadius: "var(--radius-sm)", 
              padding: "0.75rem",
              fontSize: "0.8rem",
              color: "var(--text-muted)",
              lineHeight: 1.4
            }}
          >
            <strong>Modo Demo Local Activo</strong><br />
            - Use <code>admin@ceija.edu.ar</code> para rol <strong>Administrador</strong>.<br />
            - Use <code>docente@ceija.edu.ar</code> para rol <strong>Usuario Común</strong>.<br />
            - La contraseña puede ser cualquiera.
          </div>
        )}

        {error && (
          <div 
            className="badge-error"
            style={{ 
              padding: "0.75rem 1rem", 
              borderRadius: "var(--radius-sm)", 
              display: "flex", 
              alignItems: "center", 
              gap: "0.5rem",
              fontSize: "0.85rem",
              textTransform: "none",
              letterSpacing: "normal"
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Correo Electrónico</label>
            <input 
              id="email"
              type="email" 
              className="form-control"
              placeholder="ejemplo@ceija.edu.ar"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Contraseña</label>
            <input 
              id="password"
              type="password" 
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "0.5rem" }}
            disabled={loading}
          >
            <LogIn size={18} />
            <span>{loading ? "Iniciando sesión..." : "Ingresar al Sistema"}</span>
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", margin: "0.5rem 0" }}>
          <hr style={{ flexGrow: 1, border: "none", borderTop: "1px solid var(--border-glass)" }} />
          <span style={{ padding: "0 1rem", fontSize: "0.8rem", color: "var(--text-inactive)" }}>O BIEN</span>
          <hr style={{ flexGrow: 1, border: "none", borderTop: "1px solid var(--border-glass)" }} />
        </div>

        <button 
          onClick={onBackToPublic}
          className="btn btn-secondary"
          style={{ width: "100%" }}
          disabled={loading}
        >
          <ArrowLeft size={18} />
          <span>Volver al Portal Público</span>
        </button>
      </div>
    </div>
  );
}
