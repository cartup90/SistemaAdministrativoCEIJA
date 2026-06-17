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

  // Horarios is visible for everyone (admin, common, public)
  menuItems.push({
    id: "schedules",
    label: "Horarios",
    icon: Calendar,
    roleRequired: ["admin", "comun", "public"]
  });

  // Novedades is visible for admin and common (and let's show it for public too if we want, but prompt says " cartelera digital... informar a los usuarios del sistema y servir como cartelera institucional digital". Let's show it for logged-in users and optionally public. Let's make it visible to admin/comun.
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
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 90,
          }}
        />
      )}

      {/* Sidebar Navigation Panel */}
      <aside 
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          width: "var(--sidebar-width)",
          background: "var(--bg-secondary)",
          borderRight: "1px solid var(--border-glass)",
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          padding: "2rem 1.5rem",
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform var(--transition-normal)",
          boxShadow: isOpen ? "10px 0 30px rgba(0,0,0,0.5)" : "none"
        }}
        // Apply responsive desktop style override
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
            <h2 
              style={{ 
                fontFamily: "var(--font-family-title)",
                fontSize: "1.5rem", 
                fontWeight: 700, 
                color: "#fff",
                background: "linear-gradient(135deg, #fff 40%, var(--text-muted) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}
            >
              SisGest
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>CEIJA Alberdi</p>
          </div>
          {/* Close button on Mobile */}
          <button 
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
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
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.85rem",
                  width: "100%",
                  padding: "0.85rem 1rem",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid transparent",
                  background: isActive ? "rgba(99, 102, 241, 0.15)" : "transparent",
                  borderColor: isActive ? "rgba(99, 102, 241, 0.25)" : "transparent",
                  color: isActive ? "#fff" : "var(--text-muted)",
                  fontFamily: "var(--font-family-sans)",
                  fontSize: "0.95rem",
                  fontWeight: isActive ? 600 : 500,
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all var(--transition-fast)"
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = "#fff";
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = "var(--text-muted)";
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <Icon size={18} style={{ color: isActive ? "var(--primary)" : "inherit" }} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer Area with user profile / logout */}
        <div 
          style={{ 
            borderTop: "1px solid var(--border-glass)", 
            paddingTop: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem"
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-inactive)", textTransform: "uppercase", fontWeight: 600 }}>
              Sesión Iniciada
            </span>
            <span 
              style={{ 
                fontSize: "0.9rem", 
                color: "#fff", 
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
                color: "var(--color-warning)",
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
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.85rem",
              width: "100%",
              padding: "0.85rem 1rem",
              borderRadius: "var(--radius-sm)",
              border: "1px solid transparent",
              background: "rgba(239, 68, 68, 0.08)",
              borderColor: "rgba(239, 68, 68, 0.15)",
              color: "var(--color-error)",
              fontFamily: "var(--font-family-sans)",
              fontSize: "0.95rem",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all var(--transition-fast)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)";
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
