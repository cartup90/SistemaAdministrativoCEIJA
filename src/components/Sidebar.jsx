// src/components/Sidebar.jsx
import React from "react";
import { 
  Users, 
  GraduationCap, 
  Calendar, 
  Newspaper, 
  Settings, 
  LogOut, 
  X,
  Database
} from "lucide-react";
import { isMock } from "../firebase";

export default function Sidebar({ 
  currentModule, 
  setCurrentModule, 
  user, 
  onLogout, 
  isOpen, 
  onClose 
}) {
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
  }

  // Horarios is visible for everyone
  menuItems.push({
    id: "schedules",
    label: "Horarios",
    icon: Calendar,
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
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800 }}>
              SisGest
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
              border: "1px solid transparent",
              cursor: "pointer",
              fontFamily: "var(--font-family-sans)",
              fontSize: "0.95rem",
              fontWeight: 500,
            }}
          >
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}
