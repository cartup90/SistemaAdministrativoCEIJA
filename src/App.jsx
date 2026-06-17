// src/App.jsx
import React, { useState, useEffect } from "react";
import { Menu, LogOut } from "lucide-react";
import { onAuthChange, logout } from "./firebase";
import Auth from "./components/Auth";
import Sidebar from "./components/Sidebar";
import StudentModule from "./components/StudentModule";
import TeacherModule from "./components/TeacherModule";
import ScheduleModule from "./components/ScheduleModule";
import NewsModule from "./components/NewsModule";
import ConfigModule from "./components/ConfigModule";

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentModule, setCurrentModule] = useState("students");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isPublicSchedulesView, setIsPublicSchedulesView] = useState(false);

  // Subscribe to Authentication State changes
  useEffect(() => {
    const unsubscribe = onAuthChange((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      
      // Auto-route based on roles when logging in
      if (currentUser) {
        setIsPublicSchedulesView(false);
        if (currentUser.role === "admin" || currentUser.role === "comun") {
          setCurrentModule("students");
        } else {
          setCurrentModule("schedules"); // Fallback
        }
      } else {
        setCurrentModule("schedules");
      }
    });

    return () => {
      if (unsubscribe && typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setIsPublicSchedulesView(false);
  };

  if (authLoading) {
    return (
      <div className="flex-center animate-fade-in" style={{ minHeight: "100vh", gap: "1rem", flexDirection: "column" }}>
        <div 
          style={{
            width: "40px",
            height: "40px",
            border: "3px solid rgba(99, 102, 241, 0.2)",
            borderTopColor: "var(--primary)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite"
          }}
        />
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin { to { transform: rotate(360deg); } }
        `}} />
        <span style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Cargando SisGest...</span>
      </div>
    );
  }

  // 1. PUBLIC HORARIOS VIEW
  if (!user && isPublicSchedulesView) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
        {/* Public Header */}
        <header 
          style={{
            height: "4.5rem",
            background: "var(--bg-secondary)",
            borderBottom: "1px solid var(--border-glass)",
            padding: "0 2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "between"
          }}
          className="flex-between"
        >
          <div>
            <h1 style={{ fontFamily: "var(--font-family-title)", fontSize: "1.3rem", fontWeight: 700 }}>
              Horarios CEIJA N° 12
            </h1>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Acceso Público Libre</p>
          </div>
          <button 
            onClick={() => setIsPublicSchedulesView(false)}
            className="btn btn-secondary"
            style={{ fontSize: "0.85rem", padding: "0.5rem 1rem" }}
          >
            Volver al Ingreso
          </button>
        </header>
        
        {/* Main Content Area */}
        <main style={{ padding: "2rem max(1rem, 5%)" }}>
          <ScheduleModule isPublic={true} />
        </main>
      </div>
    );
  }

  // 2. UNAUTHENTICATED LOGIN VIEW
  if (!user) {
    return (
      <Auth 
        onLoginSuccess={(loggedInUser) => setUser(loggedInUser)}
        onViewPublicSchedules={() => setIsPublicSchedulesView(true)}
      />
    );
  }

  // 3. AUTHENTICATED PANEL VIEW
  return (
    <div className="app-container">
      {/* Mobile Top Navigation Header */}
      <header className="mobile-header">
        <button 
          onClick={() => setIsMobileSidebarOpen(true)}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-main)",
            cursor: "pointer"
          }}
        >
          <Menu size={24} />
        </button>
        
        <h1 style={{ fontFamily: "var(--font-family-title)", fontSize: "1.2rem", fontWeight: 700 }}>
          SisGest
        </h1>

        <button 
          onClick={handleLogout}
          style={{
            background: "none",
            border: "none",
            color: "var(--color-error)",
            cursor: "pointer"
          }}
        >
          <LogOut size={20} />
        </button>
      </header>

      {/* Sidebar Drawer */}
      <Sidebar 
        currentModule={currentModule}
        setCurrentModule={setCurrentModule}
        user={user}
        onLogout={handleLogout}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Module Content Container */}
      <main className="main-content">
        {currentModule === "students" && <StudentModule user={user} />}
        {currentModule === "teachers" && <TeacherModule user={user} />}
        {currentModule === "schedules" && <ScheduleModule user={user} />}
        {currentModule === "news" && <NewsModule user={user} />}
        {currentModule === "config" && <ConfigModule user={user} />}
      </main>
    </div>
  );
}
