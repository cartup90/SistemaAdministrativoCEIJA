// src/App.jsx
import React, { useState, useEffect } from "react";
import { Menu, LogOut, Newspaper, Calendar, Search, FileText, X, LogIn, AlertTriangle, CheckCircle2 } from "lucide-react";
import { onAuthChange, logout, getStudentPublicInfo } from "./firebase";
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
  
  // Public Portal State
  const [showLogin, setShowLogin] = useState(false);
  const [activePublicTab, setActivePublicTab] = useState("news");
  const [dniQuery, setDniQuery] = useState("");
  const [publicStudentInfo, setPublicStudentInfo] = useState(null);
  const [publicSearchError, setPublicSearchError] = useState("");
  const [publicSearchLoading, setPublicSearchLoading] = useState(false);

  // Subscribe to Authentication State changes
  useEffect(() => {
    const unsubscribe = onAuthChange((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      
      // Auto-route based on roles when logging in
      if (currentUser) {
        setShowLogin(false);
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
  };

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
        <span style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Cargando SisGest...</span>
      </div>
    );
  }

  // 1. UNAUTHENTICATED PUBLIC PORTAL OR LOGIN VIEW
  if (!user) {
    if (showLogin) {
      return (
        <Auth 
          onLoginSuccess={(loggedInUser) => {
            setUser(loggedInUser);
            setShowLogin(false);
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
            <h1 style={{ fontFamily: "var(--font-family-title)", fontSize: "1.3rem", fontWeight: 800, color: "#fff" }}>
              SisGest
            </h1>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", background: "rgba(255,255,255,0.05)", padding: "0.2rem 0.5rem", borderRadius: "var(--radius-sm)" }}>
              CEIJA N° 12 Alberdi
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
              onClick={() => setShowLogin(true)}
              className="btn btn-secondary"
              style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", marginLeft: "0.5rem", border: "1px solid var(--primary)", color: "#fff" }}
            >
              <LogIn size={16} />
              <span style={{ marginLeft: "0.25rem" }}>Acceso Personal</span>
            </button>
          </div>
        </header>

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
            {activePublicTab === "news" ? (
              <NewsModule user={null} />
            ) : (
              <ScheduleModule user={null} isPublic={true} />
            )}
          </div>

          {/* Right Sidebar Column - DNI Consulta */}
          <div className="public-sidebar">
            <div className="glass-card animate-fade-in" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", position: "sticky", top: "6rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.5rem" }}>
                <FileText size={20} style={{ color: "var(--primary)" }} />
                <h3 style={{ color: "#fff", fontSize: "1.1rem", fontWeight: 700 }}>Consulta de Legajo</h3>
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", lineHeight: 1.4 }}>
                Consulta el estado de tu documentación obligatoria, legajo físico y materias previas ingresando tu DNI.
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
                      style={{ paddingLeft: "2.2rem" }}
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
          </div>
        </div>

        {/* Modal for Public Legajo Detail */}
        {publicStudentInfo && (
          <div style={publicModalBackdropStyle}>
            <div className="glass-card animate-fade-in" style={publicModalContentStyle(650)}>
              <div className="flex-between" style={{ borderBottom: "1px solid var(--border-glass)", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <FileText size={24} style={{ color: "var(--primary)" }} />
                  <div>
                    <h3 style={{ fontSize: "1.3rem", color: "#fff" }}>
                      Estado del Legajo Escolar
                    </h3>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      {publicStudentInfo.apellido}, {publicStudentInfo.nombre} | Curso: {publicStudentInfo.ano_actual} Año división {publicStudentInfo.division} - Turno {publicStudentInfo.turno}
                    </p>
                  </div>
                </div>
                <button onClick={() => setPublicStudentInfo(null)} style={publicCloseButtonStyle}>
                  <X size={20} />
                </button>
              </div>

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
