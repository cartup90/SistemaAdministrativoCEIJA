import React, { useState } from "react";
import { 
  Users, 
  GraduationCap, 
  Calendar, 
  CalendarDays,
  Newspaper, 
  Settings, 
  LogOut, 
  X,
  Database,
  Globe,
  Key,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2
} from "lucide-react";
import { isMock, changePassword } from "../firebase";

export default function Sidebar({ 
  currentModule, 
  setCurrentModule, 
  user, 
  onLogout, 
  isOpen, 
  onClose,
  setViewMode
}) {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const role = user ? user.role : "public";

  // Navigation items based on role
  const menuItems = [];

  if (role === "admin" || role === "comun") {
    menuItems.push({
      id: "students",
      label: "Estudiantes",
      icon: Users,
      roleRequired: ["admin", "comun"]
    });
  }

  if (role === "admin") {
    menuItems.push({
      id: "teachers",
      label: "Profesores",
      icon: GraduationCap,
      roleRequired: ["admin"]
    });
    menuItems.push({
      id: "todo",
      label: "Lista de Tareas",
      icon: CheckCircle2,
      roleRequired: ["admin"]
    });
  }

  // Horarios is visible for everyone
  menuItems.push({
    id: "schedules",
    label: "Horarios",
    icon: Calendar,
    roleRequired: ["admin", "comun", "public"]
  });

  // Calendario Escolar visible for everyone
  menuItems.push({
    id: "calendar",
    label: "Calendario Escolar",
    icon: CalendarDays,
    roleRequired: ["admin", "comun", "public"]
  });

  // Novedades is visible for admin and common
  if (role === "admin" || role === "comun") {
    menuItems.push({
      id: "news",
      label: "Cartelera",
      icon: Newspaper,
      roleRequired: ["admin", "comun"]
    });
  }

  if (role === "admin") {
    menuItems.push({
      id: "config",
      label: "Configuración",
      icon: Settings,
      roleRequired: ["admin"]
    });
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(45, 37, 30, 0.5)",
            backdropFilter: "blur(4px)",
            zIndex: 90,
          }}
        />
      )}

      {/* Sidebar Navigation Panel */}
      <aside 
        style={{
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
        }}
        className="sidebar-panel"
      >
        {/* Responsive Desktop Style Hack via tag */}
        <style dangerouslySetInnerHTML={{__html: `
          @media (min-width: 769px) {
            .sidebar-panel {
              transform: translateX(0) !important;
              box-shadow: none !important;
            }
          }
        `}} />

        {/* Header / Brand */}
        <div className="flex-between" style={{ marginBottom: "2.5rem" }}>
          <div>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 800 }}>
              Sistema Institucional
            </h2>
            <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "0.75rem", fontWeight: 500 }}>
              CEIJA Alberdi
            </p>
          </div>
          {/* Close button on Mobile */}
          <button 
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255, 255, 255, 0.6)",
              cursor: "pointer",
              display: "none"
            }}
            className="mobile-close-btn"
          >
            <X size={20} />
            <style dangerouslySetInnerHTML={{__html: `
              @media (max-width: 768px) {
                .mobile-close-btn { display: block !important; }
              }
            `}} />
          </button>
        </div>

        {/* Menu Items */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flexGrow: 1 }}>
          <button
            onClick={() => {
              setViewMode("public");
              onClose();
            }}
            className="sidebar-btn"
            style={{ 
              border: "1px dashed rgba(244, 180, 26, 0.3)",
              background: "rgba(244, 180, 26, 0.04)",
              marginBottom: "0.5rem"
            }}
          >
            <Globe size={18} style={{ color: "var(--color-ocre)" }} />
            <span style={{ fontWeight: 700, color: "var(--color-ocre)" }}>Ver Portal Público</span>
          </button>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentModule(item.id);
                  onClose();
                }}
                className={`sidebar-btn ${isActive ? "active" : ""}`}
              >
                <Icon size={18} style={{ color: isActive ? "var(--color-ocre)" : "inherit" }} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer Area with user profile / logout */}
        <div className="sidebar-footer">
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase", fontWeight: 600 }}>
              Sesión Iniciada
            </span>
            <span 
              style={{ 
                fontSize: "0.9rem", 
                fontWeight: 500,
                textOverflow: "ellipsis",
                overflow: "hidden",
                whiteSpace: "nowrap"
              }}
              title={user ? user.email : "Invitado"}
            >
              {user ? user.email : "Invitado"}
            </span>
            <span className="badge badge-success" style={{ alignSelf: "flex-start", marginTop: "0.35rem", fontSize: "0.65rem" }}>
              {role === "admin" ? "Administrador" : role === "comun" ? "Docente" : "Público"}
            </span>
          </div>

          {isMock && (
            <div 
              style={{
                fontSize: "0.7rem",
                color: "var(--color-ocre)",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem"
              }}
            >
              <Database size={10} />
              <span>Base local (Mock)</span>
            </div>
          )}

          {user && (
            <button
              onClick={() => setShowPasswordModal(true)}
              className="sidebar-logout-btn"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.85rem",
                width: "100%",
                padding: "0.55rem 1rem",
                borderRadius: "var(--radius-sm)",
                border: "1px dashed rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.03)",
                cursor: "pointer",
                fontFamily: "var(--font-family-sans)",
                fontSize: "0.85rem",
                fontWeight: 500,
                color: "rgba(255,255,255,0.85)",
                marginTop: "0.6rem",
                justifyContent: "center"
              }}
            >
              <Key size={14} />
              <span>Cambiar Contraseña</span>
            </button>
          )}

          <button 
            onClick={onLogout}
            className="sidebar-logout-btn"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.85rem",
              width: "100%",
              padding: "0.85rem 1rem",
              borderRadius: "var(--radius-sm)",
              border: "1px solid rgba(255, 255, 255, 0.35)",
              background: "rgba(255, 255, 255, 0.08)",
              cursor: "pointer",
              fontFamily: "var(--font-family-sans)",
              fontSize: "0.95rem",
              fontWeight: 600,
              marginTop: "0.5rem",
              color: "#fff"
            }}
          >
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <ChangePasswordModal 
        isOpen={showPasswordModal} 
        onClose={() => setShowPasswordModal(false)} 
      />
    </>
  );
}

function ChangePasswordModal({ isOpen, onClose }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Por favor, complete todos los campos.");
      return;
    }

    if (newPassword.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("La nueva contraseña y su confirmación no coinciden.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("La nueva contraseña debe ser diferente a la actual.");
      return;
    }

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message || "Error al cambiar la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(10, 15, 30, 0.75)",
      backdropFilter: "blur(8px)",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem"
    }}>
      <div className="glass-card animate-fade-in" style={{
        maxWidth: "420px",
        width: "100%",
        padding: "2rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
        background: "var(--bg-secondary)",
        borderRadius: "var(--radius-md)"
      }}>
        <div className="flex-between" style={{ borderBottom: "1px solid var(--border-glass)", paddingBottom: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Key size={20} style={{ color: "var(--color-ocre)" }} />
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-main)" }}>
              Cambiar Contraseña
            </h3>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", textAlign: "center", padding: "1rem 0" }}>
            <CheckCircle2 size={48} style={{ color: "var(--color-success)" }} />
            <div>
              <h4 style={{ color: "var(--text-main)", fontWeight: 700 }}>¡Contraseña Actualizada!</h4>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                Tu contraseña se ha cambiado correctamente. Úsala para tus próximos accesos.
              </p>
            </div>
            <button onClick={onClose} className="btn btn-primary" style={{ width: "100%", marginTop: "0.5rem" }}>
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {error && (
              <div className="badge-error" style={{ padding: "0.6rem 0.8rem", borderRadius: "var(--radius-sm)", fontSize: "0.8rem", textTransform: "none", letterSpacing: "normal" }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Contraseña Actual</label>
              <div style={{ position: "relative" }}>
                <input 
                  type={showCurrent ? "text" : "password"} 
                  className="form-control"
                  style={{ paddingRight: "2.5rem" }}
                  placeholder="Contraseña actual"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Nueva Contraseña (mín. 6 caracteres)</label>
              <div style={{ position: "relative" }}>
                <input 
                  type={showNew ? "text" : "password"} 
                  className="form-control"
                  style={{ paddingRight: "2.5rem" }}
                  placeholder="Nueva contraseña"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirmar Nueva Contraseña</label>
              <div style={{ position: "relative" }}>
                <input 
                  type={showConfirm ? "text" : "password"} 
                  className="form-control"
                  style={{ paddingRight: "2.5rem" }}
                  placeholder="Confirmar contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button 
                type="button" 
                onClick={onClose} 
                className="btn btn-secondary" 
                style={{ flexGrow: 1 }}
                disabled={loading}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ flexGrow: 1 }}
                disabled={loading}
              >
                {loading ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
