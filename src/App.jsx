// src/App.jsx
import React, { useState, useEffect } from "react";
import { Menu, LogOut, Newspaper, Calendar, Search, FileText, X, LogIn, AlertTriangle, CheckCircle2, BookOpen, Sparkles, Trophy, Cpu, ChevronRight, LayoutDashboard, Clock, Award, MapPin, HelpCircle, ChevronDown, Users } from "lucide-react";
import { onAuthChange, logout, getStudentPublicInfo, getSchedules } from "./firebase";
import Auth from "./components/Auth";
import Sidebar from "./components/Sidebar";
import StudentModule from "./components/StudentModule";
import TeacherModule from "./components/TeacherModule";
import ScheduleModule from "./components/ScheduleModule";
import NewsModule from "./components/NewsModule";
import ConfigModule from "./components/ConfigModule";
import CalendarModule from "./components/CalendarModule";
import TodoModule from "./components/TodoModule";
import ScienceFairModule from "./components/ScienceFairModule";

// Import school photographs
import entranceImg from "./assets/Fotos escuela/IMG_20250219_190308.jpg";
import gymImg from "./assets/Fotos escuela/IMG_20260430_210828.jpg";
import patioImg from "./assets/Fotos escuela/IMG_20260326_220211.jpg";
import corridorImg from "./assets/Fotos escuela/IMG_20251219_194717.jpg";
import muralImg from "./assets/Fotos escuela/IMG_20260430_194238.jpg";

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentModule, setCurrentModule] = useState("students");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Public Portal State
  const [showLogin, setShowLogin] = useState(false);
  const [activePublicTab, setActivePublicTab] = useState("news");
  const [dniQuery, setDniQuery] = useState("");
  const [publicStudentInfo, setPublicStudentInfo] = useState(null);
  const [publicSearchError, setPublicSearchError] = useState("");
  const [publicSearchLoading, setPublicSearchLoading] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [lightboxTitle, setLightboxTitle] = useState("");
  const [schedules, setSchedules] = useState([]);

  // Session view mode: "panel" (admin panel) or "public" (public portal)
  const [viewMode, setViewMode] = useState("panel");
  const [sessionExpiredAlert, setSessionExpiredAlert] = useState(false);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const list = await getSchedules();
        setSchedules(list || []);
      } catch (err) {
        console.error("Error loading schedules in App:", err);
      }
    };
    fetchSchedules();
  }, []);

  // Subscribe to Authentication State changes
  useEffect(() => {
    const unsubscribe = onAuthChange((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      
      // Auto-route based on roles when logging in
      if (currentUser) {
        setShowLogin(false);
        setViewMode("panel"); // Ensure we route to panel when logging in
        if (currentUser.role === "admin" || currentUser.role === "comun") {
          setCurrentModule("students");
        } else {
          setCurrentModule("schedules"); // Fallback
        }
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
    setShowLogin(false);
    localStorage.removeItem("sisgest_last_activity");
  };

  // Validate session activity on mount to catch expired sessions after page refresh
  useEffect(() => {
    const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes in ms
    const lastActivity = parseInt(localStorage.getItem("sisgest_last_activity") || "0", 10);
    const hasSession = localStorage.getItem("sisgest_user"); // for mock mode
    
    if (hasSession && lastActivity && Date.now() - lastActivity > INACTIVITY_LIMIT) {
      // Session has expired while user was away. Clear it.
      localStorage.removeItem("sisgest_user");
      localStorage.removeItem("sisgest_last_activity");
      setSessionExpiredAlert(true);
      setUser(null);
    }
  }, []);

  // Monitor activity when user is logged in
  useEffect(() => {
    if (!user) return;

    const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes in ms
    const ACTIVITY_KEY = "sisgest_last_activity";

    // Set initial activity timestamp
    localStorage.setItem(ACTIVITY_KEY, Date.now().toString());

    const updateActivity = () => {
      localStorage.setItem(ACTIVITY_KEY, Date.now().toString());
    };

    // Events that count as user activity
    const events = ["mousemove", "mousedown", "keypress", "scroll", "touchstart"];
    
    events.forEach((event) => {
      window.addEventListener(event, updateActivity);
    });

    // Check every 10 seconds if user has been inactive for > 30 minutes
    const interval = setInterval(() => {
      const lastActivity = parseInt(localStorage.getItem(ACTIVITY_KEY) || "0", 10);
      if (Date.now() - lastActivity > INACTIVITY_LIMIT) {
        handleLogout();
        setSessionExpiredAlert(true);
      }
    }, 10000);

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, updateActivity);
      });
      clearInterval(interval);
    };
  }, [user]);

  const handlePublicDniSearch = async (e) => {
    e.preventDefault();
    if (!dniQuery || dniQuery.length !== 8) {
      setPublicSearchError("El DNI debe tener exactamente 8 dígitos.");
      return;
    }

    setPublicSearchLoading(true);
    setPublicSearchError("");
    try {
      const student = await getStudentPublicInfo(dniQuery);
      if (student) {
        // Calculate apto_titular dynamically on client
        let apto = false;
        if (student.documentos) {
          const hasDni = student.documentos.dni === "Presentado";
          const hasCus = student.documentos.cus === "Presentado";
          const hasCertPrimaria = student.documentos.certificado_primaria === "Presentado";
          const hasPaseDefinitivo = student.documentos.pase_definitivo === "Presentado";
          apto = hasDni && hasCus && (hasCertPrimaria || hasPaseDefinitivo);
        }
        setPublicStudentInfo({ ...student, apto_titular: apto });
        setDniQuery("");
      } else {
        setPublicSearchError("No se encontró ningún estudiante registrado con ese DNI.");
      }
    } catch (err) {
      console.error(err);
      setPublicSearchError("Ocurrió un error al consultar la base de datos.");
    } finally {
      setPublicSearchLoading(false);
    }
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
        <span style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Cargando Sistema Institucional...</span>
      </div>
    );
  }

  // 1. UNAUTHENTICATED PUBLIC PORTAL OR LOGIN VIEW (OR VIEWING PORTAL WHILE LOGGED IN)
  if (!user || viewMode === "public") {
    if (showLogin) {
      return (
        <Auth 
          onLoginSuccess={(loggedInUser) => {
            setUser(loggedInUser);
            setShowLogin(false);
            setViewMode("panel");
          }}
          onBackToPublic={() => setShowLogin(false)}
        />
      );
    }

    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-primary)" }}>
        {/* Public Header */}
        <header 
          className="flex-between"
          style={{
            height: "4.5rem",
            background: "var(--bg-secondary)",
            borderBottom: "1px solid var(--border-glass)",
            padding: "0 max(1rem, 5%)",
            position: "sticky",
            top: 0,
            zIndex: 100
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <h1 style={{ fontFamily: "var(--font-family-title)", fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)" }}>
              Sistema Institucional
            </h1>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", background: "rgba(139, 38, 53, 0.05)", padding: "0.2rem 0.5rem", borderRadius: "var(--radius-sm)", fontWeight: 600 }}>
              CEIJA Nº12 "Remedios Escalada de San Martín" Anexo Bº Alberdi
            </span>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <button
              onClick={() => setActivePublicTab("news")}
              className={`btn ${activePublicTab === "news" ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
            >
              <Newspaper size={16} />
              <span className="hide-mobile" style={{ marginLeft: "0.25rem" }}>Cartelera</span>
            </button>
            <button
              onClick={() => setActivePublicTab("schedules")}
              className={`btn ${activePublicTab === "schedules" ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
            >
              <Calendar size={16} />
              <span className="hide-mobile" style={{ marginLeft: "0.25rem" }}>Horarios</span>
            </button>
            <button
              onClick={() => setActivePublicTab("calendar")}
              className={`btn ${activePublicTab === "calendar" ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
            >
              <Calendar size={16} style={{ color: "var(--color-ocre)" }} />
              <span className="hide-mobile" style={{ marginLeft: "0.25rem" }}>Calendario Escolar</span>
            </button>
            <button
              onClick={() => setActivePublicTab("faq")}
              className={`btn ${activePublicTab === "faq" ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
            >
              <HelpCircle size={16} />
              <span className="hide-mobile" style={{ marginLeft: "0.25rem" }}>Preguntas Frecuentes</span>
            </button>
            <button
              onClick={() => setActivePublicTab("sciencefair")}
              className={`btn ${activePublicTab === "sciencefair" ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", borderColor: activePublicTab === "sciencefair" ? undefined : "rgba(244,180,26,0.4)", color: activePublicTab === "sciencefair" ? undefined : "var(--color-ocre)" }}
            >
              <span style={{ fontSize: "1rem" }}>🔬</span>
              <span className="hide-mobile" style={{ marginLeft: "0.25rem" }}>Feria de Ciencias</span>
            </button>
            {user ? (
              <button
                onClick={() => setViewMode("panel")}
                className="btn btn-primary"
                style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", marginLeft: "0.5rem" }}
              >
                <LayoutDashboard size={16} />
                <span style={{ marginLeft: "0.25rem" }}>Volver al Panel</span>
              </button>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="btn btn-secondary"
                style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", marginLeft: "0.5rem", border: "1px solid var(--primary)", color: "var(--primary)" }}
              >
                <LogIn size={16} />
                <span style={{ marginLeft: "0.25rem" }}>Acceso Personal</span>
              </button>
            )}
          </div>
        </header>

        {/* Guirnalda "Florecerán Pañuelos" under Header */}
        {activePublicTab === "news" && (
          <div className="garland-line">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((idx) => (
              <div key={idx} className="garland-element">
                <span className="flower-bead" style={{ backgroundColor: idx % 3 === 0 ? "#E65A4B" : idx % 3 === 1 ? "#F4B41A" : "#48A9A6" }} />
                <div className="panuelo-white" title="Florecerán Pañuelos" />
              </div>
            ))}
          </div>
        )}

        {/* Hero Section (Fachada Exterior / Letrero Eva Duarte / Asimétrico) */}
        {activePublicTab === "news" && (
          <section 
            className="textured-muros"
            style={{
              padding: "3rem max(1rem, 5%) 4rem",
              borderBottom: "1px solid var(--border-glass)",
              position: "relative"
            }}
          >
            <div className="hero-layout">
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", alignItems: "flex-start", zIndex: 10 }}>
                <div className="stencil-title-container">
                  <span className="stencil-text">Escuela María Eva Duarte</span>
                </div>
                <h2 
                  style={{ 
                    fontFamily: "var(--font-family-title)", 
                    fontSize: "clamp(2rem, 3.8vw, 3rem)", 
                    fontWeight: 800, 
                    color: "var(--text-main)", 
                    lineHeight: 1.1 
                  }}
                >
                  CEIJA Nº12 "Remedios Escalada de San Martín"
                  <span style={{ display: "block", fontSize: "0.65em", fontWeight: 600, color: "var(--color-ladrillo)", marginTop: "0.25rem" }}>
                    Anexo Bº Alberdi
                  </span>
                </h2>
                <p style={{ color: "var(--text-muted)", fontSize: "1.05rem", fontWeight: 500, maxWidth: "600px", lineHeight: 1.6 }}>
                  Centro Educativo de Nivel Secundario para Jóvenes y Adultos. Anexo Alberdi. Un espacio de aprendizaje colectivo, memoria y futuro construido en comunidad.
                </p>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  <button onClick={() => {
                    const el = document.getElementById("public-navigation");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }} className="btn btn-primary">
                    <span>Ver Novedades</span>
                    <ChevronRight size={16} />
                  </button>
                  <button onClick={() => {
                    setActivePublicTab("schedules");
                    setTimeout(() => {
                      const el = document.getElementById("public-navigation");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }, 100);
                  }} className="btn btn-secondary" style={{ borderColor: "var(--color-ladrillo)", color: "var(--color-ladrillo)", fontWeight: 700 }}>
                    <span>Consultar Horarios</span>
                  </button>
                </div>
              </div>
              
              <div className="asymmetric-block-container" style={{ transform: "rotate(1deg)", border: "4px solid var(--color-ladrillo)", maxWidth: "460px", justifySelf: "center" }}>
                <img 
                  src={entranceImg} 
                  alt="Entrada CEIJA N°12" 
                  style={{ width: "100%", height: "auto", display: "block", objectFit: "cover" }}
                />
                <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", padding: "0.75rem", background: "rgba(139, 38, 53, 0.9)", color: "#fff", fontSize: "0.75rem", fontWeight: 600, textAlign: "center" }}>
                  Fachada de la Institución — Anexo Alberdi
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Wave Divider inspired by the Latin America Mural */}
        {activePublicTab === "news" && (
          <div className="wave-divider">
            <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
              <path d="M0,32 C240,70 480,95 720,80 C960,65 1200,20 1440,5 L1440,120 L0,120 Z" className="mural-fill" />
              <path d="M0,28 C240,68 480,90 720,78 C960,60 1200,18 1440,3" stroke="var(--color-ocre)" strokeWidth="4" fill="none" />
              <path d="M0,20 C240,50 480,80 720,60 C960,40 1200,10 1440,0" stroke="var(--color-ladrillo)" strokeWidth="2" fill="none" />
              
              {/* Colorful map locks inspired by Mural hair */}
              <path d="M100,55 C120,65 140,50 160,70" stroke="#E65A4B" strokeWidth="6" strokeLinecap="round" fill="none" />
              <path d="M140,65 C160,75 180,60 200,80" stroke="#F4B41A" strokeWidth="6" strokeLinecap="round" fill="none" />
              <path d="M180,75 C200,85 220,70 240,90" stroke="#48A9A6" strokeWidth="6" strokeLinecap="round" fill="none" />
              <path d="M220,85 C240,95 260,80 280,100" stroke="#8B2635" strokeWidth="6" strokeLinecap="round" fill="none" />
            </svg>
          </div>
        )}

        <div id="public-navigation" style={{ height: "1px" }} />

        {/* Public Main Body */}
        <div 
          className="public-body"
          style={{
            display: "flex",
            gap: "1.5rem",
            padding: "2rem max(1rem, 5%)",
            flexGrow: 1
          }}
        >
          {/* Style for responsive layout */}
          <style dangerouslySetInnerHTML={{__html: `
            .public-body {
              flex-direction: row;
            }
            .public-content {
              flex-grow: 1;
              width: 70%;
            }
            .public-sidebar {
              width: 300px;
              flex-shrink: 0;
            }
            .hide-mobile {
              display: inline;
            }
            @media (max-width: 900px) {
              .public-body {
                flex-direction: column !important;
              }
              .public-content {
                width: 100% !important;
              }
              .public-sidebar {
                width: 100% !important;
                order: -1;
              }
            }
            @media (max-width: 550px) {
              .hide-mobile {
                display: none !important;
              }
            }
          `}} />

          {/* Left/Main Content Column */}
          <div className="public-content">
            {activePublicTab === "news" && <NewsModule user={null} />}
            {activePublicTab === "schedules" && <ScheduleModule user={null} isPublic={true} />}
            {activePublicTab === "calendar" && <CalendarModule user={null} />}
            {activePublicTab === "faq" && <FAQPublicView />}
            {activePublicTab === "sciencefair" && <ScienceFairModule />}
          </div>

          {/* Right Sidebar Column - DNI Consulta & Info Escolar */}
          <div className="public-sidebar">
            <div style={{ position: "sticky", top: "6rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Consulta de Legajo Card */}
              <div 
                className="glass-card animate-fade-in" 
                style={{ 
                  padding: "1.5rem", 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: "1rem", 
                  borderTop: "4px solid var(--color-ladrillo) !important" 
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid rgba(139,38,53,0.08)", paddingBottom: "0.5rem" }}>
                  <FileText size={20} style={{ color: "var(--color-ladrillo)" }} />
                  <h3 style={{ color: "var(--text-main)", fontSize: "1.1rem", fontWeight: 700 }}>Consulta de Legajo</h3>
                </div>
                <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", lineHeight: 1.5 }}>
                  Verificá de manera segura tu checklist de documentación física y tus previas ingresando tu DNI.
                </p>

                <form 
                  onSubmit={handlePublicDniSearch} 
                  style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
                >
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="public_dni">Número de DNI</label>
                    <div style={{ position: "relative" }}>
                      <input 
                        id="public_dni"
                        type="text" 
                        maxLength={8}
                        className="form-control"
                        placeholder="Ej. 45678901"
                        value={dniQuery}
                        onChange={(e) => {
                          setDniQuery(e.target.value.replace(/\D/g, ""));
                          setPublicSearchError("");
                        }}
                        disabled={publicSearchLoading}
                        style={{ paddingLeft: "2.2rem", borderColor: "var(--border-glass)" }}
                      />
                      <Search size={14} style={{ position: "absolute", left: "0.8rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-inactive)" }} />
                    </div>
                  </div>

                  {publicSearchError && (
                    <div style={{ color: "var(--color-error)", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.25rem", textTransform: "none", letterSpacing: "normal" }}>
                      <AlertTriangle size={12} style={{ flexShrink: 0 }} />
                      <span>{publicSearchError}</span>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    style={{ width: "100%", padding: "0.6rem" }}
                    disabled={publicSearchLoading || !dniQuery}
                  >
                    {publicSearchLoading ? "Buscando..." : "Consultar Legajo"}
                  </button>
                </form>
              </div>

              {/* Información Escolar Card */}
              <div 
                className="glass-card animate-fade-in" 
                style={{ 
                  padding: "1.5rem", 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: "1rem", 
                  borderTop: "4px solid var(--color-ocre) !important" 
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid rgba(244,180,26,0.15)", paddingBottom: "0.5rem" }}>
                  <BookOpen size={20} style={{ color: "var(--color-ocre)" }} />
                  <h3 style={{ color: "var(--text-main)", fontSize: "1.1rem", fontWeight: 700 }}>Información Escolar</h3>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  {/* Horario */}
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                    <Clock size={16} style={{ color: "var(--color-ocre)", flexShrink: 0, marginTop: "0.1rem" }} />
                    <div>
                      <strong>Horario de cursado:</strong>
                      <div style={{ color: "var(--text-main)", marginTop: "0.1rem" }}>Lunes a Viernes de 18:50 a 22:30 hs.</div>
                    </div>
                  </div>

                  {/* Orientación */}
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                    <Award size={16} style={{ color: "var(--color-ocre)", flexShrink: 0, marginTop: "0.1rem" }} />
                    <div>
                      <strong>Orientación:</strong>
                      <div style={{ color: "var(--text-main)", marginTop: "0.1rem" }}>Cs. Naturales</div>
                    </div>
                  </div>

                  {/* Ubicación */}
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                    <MapPin size={16} style={{ color: "var(--color-ocre)", flexShrink: 0, marginTop: "0.1rem" }} />
                    <div>
                      <strong>Ubicación:</strong>
                      <div style={{ marginTop: "0.1rem" }}>
                        <a 
                          href="https://maps.app.goo.gl/FMZ8o4wiXXR7h6LdA" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ color: "var(--primary)", textDecoration: "underline", fontWeight: 600 }}
                        >
                          Ver en Google Maps
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Consultas */}
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", background: "rgba(244,180,26,0.06)", border: "1px dashed rgba(244,180,26,0.15)", padding: "0.6rem", borderRadius: "var(--radius-sm)", marginTop: "0.25rem" }}>
                    <HelpCircle size={16} style={{ color: "var(--color-ocre)", flexShrink: 0, marginTop: "0.1rem" }} />
                    <div style={{ fontSize: "0.8rem", color: "var(--text-main)", fontWeight: 500 }}>
                      Para consultas, acercarse a la escuela.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Consultas Administrativas Section (Robot CEIJA) */}
        {activePublicTab === "news" && (
          <section 
            className="glass-card animate-fade-in"
            style={{
              margin: "1rem max(1rem, 5%) 2.5rem",
              padding: "2.25rem 2rem",
              background: "rgba(244, 180, 26, 0.04)",
              border: "1px solid var(--border-glass)",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "2rem"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1.75rem", flexWrap: "wrap" }}>
              <div style={{ flexShrink: 0 }}>
                {/* SVG Drawing of the robot "CEIJA" on the window */}
                <svg className="robot-float" width="90" height="90" viewBox="0 0 100 100">
                  <rect x="25" y="20" width="50" height="40" rx="10" fill="var(--color-ladrillo)" stroke="var(--color-ocre)" strokeWidth="3" />
                  <rect x="32" y="26" width="36" height="24" rx="5" fill="#FFF" />
                  <circle cx="43" cy="35" r="3.5" fill="var(--color-ladrillo)" />
                  <circle cx="57" cy="35" r="3.5" fill="var(--color-ladrillo)" />
                  <path d="M 45 43 Q 50 46 55 43" stroke="var(--color-ladrillo)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  <line x1="50" y1="20" x2="50" y2="8" stroke="var(--color-ocre)" strokeWidth="3" />
                  <circle cx="50" cy="8" r="4" fill="var(--color-ladrillo)" />
                  <rect x="33" y="65" width="34" height="28" rx="6" fill="var(--color-ocre)" stroke="var(--color-ladrillo)" strokeWidth="2.5" />
                  <rect x="44" y="60" width="12" height="6" fill="var(--text-muted)" />
                  <text x="50" y="82" fontSize="9" fontWeight="bold" fill="var(--color-ladrillo)" textAnchor="middle">CEIJA</text>
                </svg>
              </div>
              
              <div>
                <h3 style={{ fontSize: "1.4rem", color: "var(--color-ladrillo)", marginBottom: "0.5rem", fontWeight: 800 }}>
                  Consultas Administrativas para Estudiantes
                </h3>
                <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", maxWidth: "600px", lineHeight: 1.6, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <p><strong>• ¿Qué necesito para anotarme?</strong> Se requiere fotocopia de DNI, constancia de CUIL, certificado de estudios anteriores (primaria o analítico parcial) y C.U.S.</p>
                  <p><strong>• ¿Quién puede ingresar al secundario de adultos y con qué edad?</strong> Pueden ingresar jóvenes y adultos a partir de los 18 años de edad que no hayan completado el nivel secundario.</p>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-inactive)", fontStyle: "italic", marginTop: "0.25rem" }}>
                    * Explorá las dudas administrativas más comunes en nuestra sección de preguntas frecuentes.
                  </p>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => {
                setActivePublicTab("faq");
                setTimeout(() => {
                  const el = document.getElementById("public-navigation");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }, 100);
              }}
              className="btn btn-secondary" 
              style={{ border: "1px solid var(--color-ocre)", color: "var(--color-ladrillo)", fontWeight: 700 }}
            >
              <span>Consultar Preguntas Frecuentes</span>
            </button>
          </section>
        )}

        {/* Dynamic Spaces Gallery (Gym, Acts Patio, Corridor, Mural) */}
        {activePublicTab === "news" && (
          <section style={{ padding: "0.5rem max(1rem, 5%) 3.5rem" }}>
            <h3 style={{ fontSize: "1.5rem", marginBottom: "1.5rem", borderBottom: "2px solid var(--color-ocre)", paddingBottom: "0.4rem", display: "inline-block", fontWeight: 800 }}>
              Nuestros Espacios y Actividades
            </h3>
            
            <div className="grid-cols-3">
              <div 
                className="gallery-card" 
                onClick={() => { setLightboxImg(patioImg); setLightboxTitle("Patio Principal - Acto Institucional"); }}
              >
                <img src={patioImg} alt="Acto escolar patio" className="gallery-image" />
                <div className="gallery-overlay">
                  <h4>Patio Principal</h4>
                  <p>Lugar de encuentro durante los actos escolares y festejos comunitarios.</p>
                </div>
              </div>
              
              <div 
                className="gallery-card" 
                onClick={() => { setLightboxImg(gymImg); setLightboxTitle("Gimnasio y Salón Cubierto"); }}
              >
                <img src={gymImg} alt="Gimnasio con aro de basket" className="gallery-image" />
                <div className="gallery-overlay">
                  <h4>Gimnasio Escolar</h4>
                  <p>Espacio deportivo con aros de básquet y zócalos color ladrillo.</p>
                </div>
              </div>
              
              <div 
                className="gallery-card" 
                onClick={() => { setLightboxImg(corridorImg); setLightboxTitle("Galería y Puertas de Aulas"); }}
              >
                <img src={corridorImg} alt="Corredor y aulas" className="gallery-image" />
                <div className="gallery-overlay">
                  <h4>Galería y Aulas</h4>
                  <p>Corredores con pisos de granito y puertas de madera restauradas.</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Footer with Pañuelos decoration */}
        <footer 
          style={{
            background: "var(--bg-secondary)",
            borderTop: "1px solid var(--border-glass)",
            marginTop: "auto"
          }}
        >
          <div className="garland-line" style={{ transform: "rotate(180deg)", opacity: 0.7 }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((idx) => (
              <div key={idx} className="garland-element">
                <span className="flower-bead" style={{ backgroundColor: idx % 2 === 0 ? "#E65A4B" : "#F4B41A" }} />
                <div className="panuelo-white" />
              </div>
            ))}
          </div>
          <div style={{ padding: "2rem max(1rem, 5%)", textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)" }}>
            <p style={{ fontWeight: 700, color: "var(--text-main)" }}>CEIJA Nº12 "Remedios Escalada de San Martín" Anexo Bº Alberdi</p>
            <p style={{ fontSize: "0.75rem", marginTop: "0.35rem" }}>© 2026 Sistema de Gestión Administrativa (Sistema Institucional). Diseñado por Catriel Pardo.</p>
          </div>
        </footer>

        {/* Lightbox Modal for Gallery */}
        {lightboxImg && (
          <div className="lightbox-backdrop" onClick={() => setLightboxImg(null)}>
            <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
              <img src={lightboxImg} alt={lightboxTitle} className="lightbox-img" />
              <h4 style={{ color: "#fff", marginTop: "1rem", fontSize: "1.15rem", fontWeight: 700, textAlign: "center" }}>
                {lightboxTitle}
              </h4>
              <button 
                onClick={() => setLightboxImg(null)} 
                className="btn btn-secondary" 
                style={{ marginTop: "1rem", color: "#fff", borderColor: "#fff", background: "rgba(255,255,255,0.08)" }}
              >
                Cerrar Imagen
              </button>
            </div>
          </div>
        )}

        {/* Modal for Public Legajo Detail */}
        {publicStudentInfo && (
          <div style={publicModalBackdropStyle}>
            <div className="glass-card animate-fade-in" style={publicModalContentStyle(650)}>
              <div className="flex-between" style={{ borderBottom: "1px solid var(--border-glass)", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <FileText size={24} style={{ color: "var(--color-ladrillo)" }} />
                  <div>
                    <h3 style={{ fontSize: "1.3rem", color: "var(--text-main)" }}>
                      Estado del Legajo Escolar
                    </h3>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 500 }}>
                      {publicStudentInfo.apellido}, {publicStudentInfo.nombre} | {publicStudentInfo.ano_actual === "No cursa" ? "No cursa actualmente" : `Curso: ${publicStudentInfo.ano_actual} Año div. ${publicStudentInfo.division} - Turno ${publicStudentInfo.turno}`}
                    </p>
                  </div>
                </div>
                <button onClick={() => setPublicStudentInfo(null)} style={publicCloseButtonStyle}>
                  <X size={20} />
                </button>
              </div>

              {/* Horario del día actual */}
              {(() => {
                const daysMap = {
                  1: "Lunes",
                  2: "Martes",
                  3: "Miércoles",
                  4: "Jueves",
                  5: "Viernes"
                };
                const todayNum = new Date().getDay();
                const todayName = daysMap[todayNum];
                const isWeekend = todayNum === 0 || todayNum === 6;
                const displayDay = isWeekend ? "Lunes" : todayName;

                if (publicStudentInfo.ano_actual === "No cursa") {
                  return (
                    <div className="glass-card" style={{ padding: "1.25rem", background: "rgba(0,0,0,0.02)", marginBottom: "1.5rem", borderLeft: "4px solid var(--color-warning)" }}>
                      <h4 style={{ color: "var(--text-main)", marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Calendar size={18} style={{ color: "var(--color-warning)" }} />
                        <span>Horario Escolar</span>
                      </h4>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                        Este estudiante no está cursando actualmente, por lo que no tiene un horario asignado.
                      </p>
                    </div>
                  );
                }

                const studentSchedule = schedules.find(s => s.ano === publicStudentInfo.ano_actual);
                
                if (!studentSchedule || !studentSchedule.bloques || studentSchedule.bloques.length === 0) {
                  return (
                    <div className="glass-card" style={{ padding: "1.25rem", background: "rgba(0,0,0,0.02)", marginBottom: "1.5rem", borderLeft: "4px solid var(--color-warning)" }}>
                      <h4 style={{ color: "var(--text-main)", marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Calendar size={18} style={{ color: "var(--color-warning)" }} />
                        <span>Horario Escolar</span>
                      </h4>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                        No hay horarios cargados para {publicStudentInfo.ano_actual} Año todavía.
                      </p>
                    </div>
                  );
                }

                // Find active blocks for today (or reference day)
                const activeBlocks = studentSchedule.bloques.filter(b => {
                  const cell = b.dias ? b.dias[displayDay] : null;
                  return cell && cell.materia && cell.materia !== "---------------" && cell.materia.toUpperCase() !== "RECREO";
                });

                if (activeBlocks.length === 0) {
                  return (
                    <div className="glass-card" style={{ padding: "1.25rem", background: "rgba(0,0,0,0.02)", marginBottom: "1.5rem", borderLeft: "4px solid var(--color-ocre)" }}>
                      <h4 style={{ color: "var(--text-main)", marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Calendar size={18} style={{ color: "var(--color-ocre)" }} />
                        <span>Horario de Hoy ({todayName || "Fin de semana"})</span>
                      </h4>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                        {isWeekend 
                          ? "Hoy es fin de semana, no hay clases programadas." 
                          : `No tenés materias programadas para hoy (${todayName}).`}
                      </p>
                    </div>
                  );
                }

                // Get first start time and last end time
                const startTime = studentSchedule.bloques.find(b => {
                  const cell = b.dias ? b.dias[displayDay] : null;
                  return cell && cell.materia && cell.materia !== "---------------";
                })?.inicio;

                const reversedBlocks = [...studentSchedule.bloques].reverse();
                const endTime = reversedBlocks.find(b => {
                  const cell = b.dias ? b.dias[displayDay] : null;
                  return cell && cell.materia && cell.materia !== "---------------";
                })?.fin;

                // Unique subject list for today
                const subjects = activeBlocks.map(b => b.dias[displayDay].materia);
                const uniqueSubjects = [...new Set(subjects)];

                return (
                  <div className="glass-card animate-fade-in" style={{ padding: "1.25rem", background: "rgba(244, 180, 26, 0.05)", borderLeft: "5px solid var(--color-ocre)", marginBottom: "1.5rem" }}>
                    <div className="flex-between" style={{ marginBottom: "0.5rem" }}>
                      <h4 style={{ color: "var(--color-ladrillo)", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 800 }}>
                        <Calendar size={18} style={{ color: "var(--color-ladrillo)" }} />
                        <span>
                          {isWeekend ? `Horario de Cursado (${displayDay})` : `Horario para Hoy (${todayName})`}
                        </span>
                      </h4>
                      {isWeekend && (
                        <span className="badge badge-warning" style={{ fontSize: "0.7rem" }}>Fin de Semana</span>
                      )}
                    </div>
                    
                    <p style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.5rem" }}>
                      {publicStudentInfo.ano_actual} Año: de <span style={{ color: "var(--color-ladrillo)" }}>{startTime}</span> a <span style={{ color: "var(--color-ladrillo)" }}>{endTime}</span> hs
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>
                        Materias programadas:
                      </span>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.15rem" }}>
                        {uniqueSubjects.map((sub, sIdx) => (
                          <span 
                            key={sIdx} 
                            style={{ 
                              fontSize: "0.75rem", 
                              backgroundColor: "rgba(139, 38, 53, 0.06)", 
                              color: "var(--color-ladrillo)", 
                              padding: "0.25rem 0.6rem", 
                              borderRadius: "var(--radius-sm)", 
                              fontWeight: 600,
                              border: "1px solid rgba(139, 38, 53, 0.12)"
                            }}
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Document checklist */}
              <div className="glass-card" style={{ padding: "1.25rem", background: "rgba(0,0,0,0.2)", marginBottom: "1.5rem" }}>
                <h4 style={{ color: "#fff", marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Control de Documentación Física</span>
                  {publicStudentInfo.apto_titular ? (
                    <span className="badge badge-success">APTO PARA TITULAR</span>
                  ) : (
                    <span className="badge badge-error">INCOMPLETO PARA TITULAR</span>
                  )}
                </h4>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "0.75rem" }}>
                  {/* DNI */}
                  <div style={publicDocCheckStyle(publicStudentInfo.documentos?.dni)}>
                    <strong>Fotocopia DNI:</strong>
                    <span>{publicStudentInfo.documentos?.dni || "Pendiente"}</span>
                  </div>
                  {/* CUS */}
                  <div style={publicDocCheckStyle(publicStudentInfo.documentos?.cus)}>
                    <strong>Cert. Salud (CUS):</strong>
                    <span>{publicStudentInfo.documentos?.cus || "Pendiente"}</span>
                  </div>
                  {/* Certificado Primaria */}
                  <div style={publicDocCheckStyle(publicStudentInfo.documentos?.certificado_primaria)}>
                    <strong>Certificado Primaria:</strong>
                    <span>{publicStudentInfo.documentos?.certificado_primaria || "Pendiente"}</span>
                  </div>
                  {/* Pase Provisorio */}
                  <div style={publicDocCheckStyle(publicStudentInfo.documentos?.pase_provisorio)}>
                    <strong>Pase Provisorio:</strong>
                    <span>{publicStudentInfo.documentos?.pase_provisorio || "Pendiente"}</span>
                  </div>
                  {/* Pase Definitivo */}
                  <div style={publicDocCheckStyle(publicStudentInfo.documentos?.pase_definitivo)}>
                    <strong>Pase Definitivo:</strong>
                    <span>{publicStudentInfo.documentos?.pase_definitivo || "Pendiente"}</span>
                  </div>
                </div>
              </div>

              {/* Previas table */}
              <div className="glass-card" style={{ padding: "1.25rem", background: "rgba(0,0,0,0.2)", marginBottom: "1.5rem" }}>
                <h4 style={{ color: "#fff", marginBottom: "0.75rem" }}>
                  Materias Previas y Equivalencias Pendientes
                </h4>
                
                {!publicStudentInfo.previas || publicStudentInfo.previas.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontStyle: "italic", padding: "0.5rem 0" }}>
                    No registras materias previas ni equivalencias pendientes en la institución.
                  </p>
                ) : (
                  <div className="table-container">
                    <table className="custom-table" style={{ fontSize: "0.85rem" }}>
                      <thead>
                        <tr>
                          <th>Materia</th>
                          <th>Año</th>
                          <th>Tipo</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {publicStudentInfo.previas.map((p, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 600 }}>{p.nombre_materia}</td>
                            <td>{p.ano_materia}</td>
                            <td>{p.tipo}</td>
                            <td>
                              <span 
                                className="badge"
                                style={{
                                  backgroundColor: 
                                    p.estado === "Aprobada" ? "var(--color-success-bg)" : 
                                    p.estado === "En proceso" ? "var(--color-warning-bg)" : 
                                    "var(--color-error-bg)",
                                  color: 
                                    p.estado === "Aprobada" ? "var(--color-success)" : 
                                    p.estado === "En proceso" ? "var(--color-warning)" : 
                                    "var(--color-error)"
                                }}
                              >
                                {p.estado}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Privacy Disclaimer */}
              <div style={{ display: "flex", gap: "0.5rem", background: "rgba(99,102,241,0.06)", border: "1px dashed rgba(99,102,241,0.2)", borderRadius: "var(--radius-sm)", padding: "0.75rem", fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                <CheckCircle2 size={16} style={{ color: "var(--primary)", flexShrink: 0, marginTop: "0.1rem" }} />
                <span>
                  <strong>Aviso de Privacidad:</strong> Este portal de consulta no revela información de contacto privada (teléfono, domicilio, correo, fecha de nacimiento) para proteger la privacidad de los alumnos.
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
                <button onClick={() => setPublicStudentInfo(null)} className="btn btn-secondary">
                  Cerrar Consulta
                </button>
              </div>
            </div>
          </div>
        )}
        <SessionExpiredModal isOpen={sessionExpiredAlert} onClose={() => setSessionExpiredAlert(false)} />
      </div>
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
          SisInt
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
        setViewMode={setViewMode}
      />

      {/* Main Module Content Container */}
      <main className="main-content">
        {currentModule === "students" && <StudentModule user={user} />}
        {currentModule === "teachers" && <TeacherModule user={user} />}
        {currentModule === "schedules" && <ScheduleModule user={user} />}
        {currentModule === "news" && <NewsModule user={user} />}
        {currentModule === "calendar" && <CalendarModule user={user} />}
        {currentModule === "todo" && <TodoModule user={user} />}
        {currentModule === "config" && <ConfigModule user={user} />}
      </main>
      <SessionExpiredModal isOpen={sessionExpiredAlert} onClose={() => setSessionExpiredAlert(false)} />
    </div>
  );
}

// Styling definitions for public modals
const publicModalBackdropStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(10, 15, 30, 0.75)",
  backdropFilter: "blur(8px)",
  zIndex: 200,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "2rem max(1rem, 5%)",
  overflowY: "auto"
};

const publicModalContentStyle = (maxWidth) => ({
  width: "100%",
  maxWidth: `${maxWidth}px`,
  padding: "2rem",
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  background: "var(--bg-secondary)",
  borderRadius: "var(--radius-md)"
});

const publicCloseButtonStyle = {
  background: "none",
  border: "none",
  color: "var(--text-muted)",
  cursor: "pointer",
  transition: "color var(--transition-fast)"
};

const publicDocCheckStyle = (status) => {
  const isPresented = status === "Presentado" || status === "Reemplazado";
  const isNa = status === "No aplica";
  return {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    padding: "0.6rem 0.8rem",
    borderRadius: "var(--radius-sm)",
    border: "1px solid",
    backgroundColor: isPresented ? "var(--color-success-bg)" : isNa ? "rgba(255,255,255,0.02)" : "var(--color-error-bg)",
    borderColor: isPresented ? "rgba(16, 185, 129, 0.2)" : isNa ? "rgba(255,255,255,0.05)" : "rgba(239, 68, 68, 0.2)",
    color: isPresented ? "var(--color-success)" : isNa ? "var(--text-muted)" : "var(--color-error)",
    fontSize: "0.8rem"
  };
};

function SessionExpiredModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(10, 15, 30, 0.8)",
      backdropFilter: "blur(12px)",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem"
    }}>
      <div className="glass-card animate-fade-in" style={{
        maxWidth: "400px",
        width: "100%",
        padding: "2.5rem 2rem",
        textAlign: "center",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
        background: "var(--bg-secondary)",
        borderRadius: "var(--radius-md)"
      }}>
        <div style={{
          display: "inline-flex",
          padding: "1rem",
          borderRadius: "50%",
          background: "rgba(244, 180, 26, 0.1)",
          color: "var(--color-ocre)",
          marginBottom: "1.25rem"
        }}>
          <AlertTriangle size={32} />
        </div>
        <h3 style={{ fontSize: "1.3rem", color: "var(--text-main)", marginBottom: "0.75rem", fontWeight: 800 }}>
          Sesión Expirada
        </h3>
        <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "1.75rem", lineHeight: 1.6 }}>
          Tu sesión se ha cerrado automáticamente debido a 30 minutos de inactividad para proteger tu información de acceso.
        </p>
        <button 
          onClick={onClose}
          className="btn btn-primary"
          style={{ width: "100%", padding: "0.75rem", fontWeight: 700 }}
        >
          Entendido
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// PUBLIC FAQ MODULE & DATA
// ============================================================================

const faqData = [
  {
    category: "Información General de la Escuela",
    icon: Sparkles,
    items: [
      {
        id: "gen_1",
        question: "¿La escuela es pública o privada? ¿Hay que pagar cuota?",
        answer: "Nuestra institución es una escuela secundaria de gestión pública y totalmente gratuita."
      },
      {
        id: "gen_2",
        question: "¿Cuál es la modalidad de estudio? ¿Se puede cursar a distancia?",
        answer: "La modalidad de la escuela es estrictamente presencial. Cumplir con la asistencia es un requisito fundamental para poder certificar la regularidad como estudiante."
      }
    ]
  },
  {
    category: "Requisitos de Ingreso y Edad",
    icon: Users,
    items: [
      {
        id: "req_1",
        question: "¿Cuáles son los requisitos de edad para poder inscribirme?",
        answer: "El requisito general es ser mayor de 18 años. Sin embargo, existe una excepción para los jóvenes de 17 años: pueden ingresar si cumplen los 18 años antes del 1 de enero del año siguiente (es decir, si aún no los han cumplido durante el año en curso)."
      },
      {
        id: "req_2",
        question: "Tengo 16 años, ¿puedo anotarme en la escuela?",
        answer: "No, la edad mínima de ingreso es de 18 años (o 17 bajo la condición de cumplir los 18 antes del 1 de enero del año entrante). No existen excepciones para edades menores."
      },
      {
        id: "req_3",
        question: "¿Es obligatorio tener la primaria completa?",
        answer: "Sí, es un requisito necesario tener la escolaridad primaria terminada."
      },
      {
        id: "req_4",
        question: "No terminé la primaria, ¿puedo estudiar en el CEIJA?",
        answer: "Para ingresar al secundario debes haber concluido la primaria. Si no la terminaste, te invitamos a que nos consultes directamente para que te informemos y orientemos sobre cómo realizarla y completarla."
      }
    ]
  },
  {
    category: "Inscripción y Documentación",
    icon: FileText,
    items: [
      {
        id: "doc_1",
        question: "¿Qué papeles necesito presentar para la inscripción inicial?",
        answer: "Para iniciar el proceso de inscripción es necesario que traigas la fotocopia de tu DNI."
      },
      {
        id: "doc_2",
        question: "¿Cuál es la documentación completa obligatoria que debo entregar?",
        answer: "Para conformar el legajo definitivo, la documentación necesaria y obligatoria es:\n\n• DNI original y fotocopia.\n• Certificado Único de Salud (CUS).\n• Certificado de estudios anteriores (ya sea el certificado de la primaria terminada o el pase de otra escuela secundaria).\n\nEs importante destacar que no se contemplan excepciones en la entrega de estos requisitos documentales."
      }
    ]
  },
  {
    category: "Duración, Equivalencias y Planes de Estudio",
    icon: Calendar,
    items: [
      {
        id: "plan_1",
        question: "¿Cuántos años dura el secundario en el CEIJA?",
        answer: "El cursado completo se realiza en 3 años."
      },
      {
        id: "plan_2",
        question: "¿Cómo se estructuran los años de cursado respecto a la secundaria común?",
        answer: "Nuestra estructura es la siguiente:\n\n• 1er Año (Ciclo Básico): Equivale a los primeros 3 años de la secundaria común.\n• 2do Año: Equivale al 4to año de la secundaria común.\n• 3er Año (Ciclo Orientado): Equivale al 5to y 6to año de la secundaria común."
      },
      {
        id: "plan_3",
        question: "Hice un tiempo de secundaria común pero aprobé menos de 3 años, ¿en qué año ingreso?",
        answer: "Si en tu escuela anterior aprobaste menos de los primeros 3 años, te corresponde ingresar directamente a nuestro 1er año."
      },
      {
        id: "plan_4",
        question: "¿Qué necesito para ingresar directamente a 2do año?",
        answer: "Para ingresar a 2do año debes haber aprobado los primeros 3 años de la secundaria común y no adeudar (llevarte) más de 2 materias. Además, es obligatorio presentar el pase provisorio de manera obligatoria para certificarlo."
      },
      {
        id: "plan_5",
        question: "¿Qué necesito para ingresar directamente a 3er año?",
        answer: "Para ingresar a 3er año debes haber completado el 4to año de la secundaria común y no adeudar (llevarte) más de 2 materias. Al igual que en el caso anterior, la presentación del pase provisorio es obligatoria."
      },
      {
        id: "plan_6",
        question: "¿Qué son las \"Equivalencias\" y por qué tendría que rendirlas?",
        answer: "Cuando ingresas con un pase de otra escuela, los planes de estudio suelen ser diferentes. Por este motivo, para nivelar los contenidos, es necesario rendir algunas materias específicas de los años anteriores de nuestra institución, las cuales denominamos Equivalencias."
      },
      {
        id: "plan_7",
        question: "Voy a ingresar a 2do año con pase, ¿debo rendir equivalencias?",
        answer: "Por lo general, los estudiantes que ingresan a 2do año con pase de otra institución no deben rendir equivalencias, a menos que provengan de un plan de estudios antiguo."
      },
      {
        id: "plan_8",
        question: "Voy a ingresar a 3er año con pase, ¿qué materias de equivalencia debo rendir?",
        answer: "Por lo general, los estudiantes que ingresan en el 3er año deben rendir 4 materias correspondientes a nuestro segundo año:\n\n• Derecho del Trabajo y de la Seguridad Social.\n• Problemáticas Económicas Actuales.\n• Ciencia, Sociedad y Desarrollo.\n• Psicología Social."
      },
      {
        id: "plan_9",
        question: "¿Me puedo inscribir a 2do o 3er año debiendo más de 2 materias del colegio anterior?",
        answer: "No, el límite máximo para el ingreso regular al año correspondiente con el pase es de hasta 2 materias adeudadas."
      }
    ]
  }
];

function FAQPublicView() {
  const [faqSearch, setFaqSearch] = useState("");
  const [openFaq, setOpenFaq] = useState({});

  const toggleFaq = (id) => {
    setOpenFaq(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredFaq = faqData.map(category => {
    const items = category.items.filter(item => 
      item.question.toLowerCase().includes(faqSearch.toLowerCase()) || 
      item.answer.toLowerCase().includes(faqSearch.toLowerCase())
    );
    return { ...category, items };
  }).filter(category => category.items.length > 0);

  return (
    <div className="glass-card animate-fade-in" style={{ padding: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", borderBottom: "2px solid var(--color-ocre)", paddingBottom: "0.75rem", marginBottom: "1.5rem" }}>
        <HelpCircle size={28} style={{ color: "var(--color-ladrillo)" }} />
        <div>
          <h2 style={{ fontFamily: "var(--font-family-title)", fontSize: "1.6rem", fontWeight: 800, color: "var(--text-main)" }}>
            Preguntas Frecuentes
          </h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>
            Respuestas rápidas a las consultas administrativas y académicas más comunes
          </p>
        </div>
      </div>

      {/* FAQ Search Bar */}
      <div style={{ marginBottom: "2rem", position: "relative" }}>
        <input 
          type="text"
          className="form-control"
          placeholder="Buscar pregunta o tema (ej. equivalencias, edad, inscripción)..."
          value={faqSearch}
          onChange={(e) => setFaqSearch(e.target.value)}
          style={{ paddingLeft: "2.5rem", height: "3rem", fontSize: "0.95rem", borderRadius: "var(--radius-md)" }}
        />
        <Search size={18} style={{ position: "absolute", left: "0.9rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-inactive)" }} />
        {faqSearch && (
          <button 
            onClick={() => setFaqSearch("")}
            style={{ position: "absolute", right: "0.9rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-inactive)", cursor: "pointer" }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* FAQ List */}
      {filteredFaq.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)" }}>
          <HelpCircle size={40} style={{ color: "var(--text-inactive)", marginBottom: "1rem", opacity: 0.5 }} />
          <p style={{ fontWeight: 600 }}>No encontramos respuestas que coincidan con tu búsqueda.</p>
          <p style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>Prueba con otras palabras clave o acércate a la institución.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {filteredFaq.map((cat, catIdx) => {
            const CatIcon = cat.icon;
            return (
              <div key={catIdx} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.15rem", color: "var(--color-ladrillo)", fontWeight: 700, paddingBottom: "0.35rem", borderBottom: "1px solid rgba(139, 38, 53, 0.1)" }}>
                  <CatIcon size={18} />
                  <span>{cat.category}</span>
                </h3>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {cat.items.map((item) => {
                    const isOpen = !!openFaq[item.id];
                    return (
                      <div 
                        key={item.id}
                        style={{
                          border: "1px solid var(--border-glass)",
                          borderRadius: "var(--radius-sm)",
                          background: "rgba(255, 255, 255, 0.02)",
                          overflow: "hidden",
                          transition: "all 0.2s ease"
                        }}
                      >
                        <button
                          onClick={() => toggleFaq(item.id)}
                          style={{
                            width: "100%",
                            padding: "1rem 1.25rem",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            textAlign: "left",
                            gap: "1rem"
                          }}
                        >
                          <span style={{ fontWeight: 600, color: isOpen ? "var(--color-ocre)" : "var(--text-main)", fontSize: "0.95rem", lineHeight: 1.4, transition: "color 0.2s ease" }}>
                            {item.question}
                          </span>
                          <span style={{ 
                            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", 
                            transition: "transform 0.2s ease",
                            color: "var(--text-inactive)",
                            flexShrink: 0
                          }}>
                            <ChevronDown size={18} />
                          </span>
                        </button>
                        
                        {isOpen && (
                          <div 
                            style={{
                              padding: "0 1.25rem 1.25rem",
                              color: "var(--text-muted)",
                              fontSize: "0.9rem",
                              lineHeight: 1.6,
                              whiteSpace: "pre-line",
                              borderTop: "1px solid rgba(255, 255, 255, 0.04)",
                              paddingTop: "1rem",
                              animation: "slideDown 0.2s ease-out"
                            }}
                          >
                            {item.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
