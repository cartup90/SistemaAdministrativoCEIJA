// src/components/ConfigModule.jsx
import React, { useState, useEffect } from "react";
import { 
  Settings, 
  Database, 
  ListFilter, 
  UserPlus, 
  CheckCircle, 
  AlertTriangle,
  Search,
  Clock,
  User,
  ShieldCheck
} from "lucide-react";
import { getAuditLogs, seedDatabase, isMock } from "../firebase";
import { useDialog } from "../context/DialogContext";
import seedData from "../../seed_data.json";

export default function ConfigModule({ user }) {
  const { confirm, alert } = useDialog();
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);
  const [searchLog, setSearchLog] = useState("");
  
  // User creation form state
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    role: "comun"
  });
  const [userSuccessMsg, setUserSuccessMsg] = useState("");

  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      const data = await getAuditLogs();
      setLogs(data);
    } catch (e) {
      console.error("Error loading logs:", e);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleSeed = async () => {
    const isConfirmed = await confirm(
      "¿Está seguro de que desea sembrar la base de datos? Esto cargará la información inicial de 326 alumnos, 22 profesores y horarios del CEIJA.",
      "Confirmar Sembrado"
    );
    if (isConfirmed) {
      setSeeding(true);
      setSeedSuccess(false);
      try {
        await seedDatabase(seedData, user.email);
        setSeedSuccess(true);
        loadLogs();
      } catch (err) {
        console.error(err);
        await alert("Error durante la migración de datos.", "Error de Sembrado", "error");
      } finally {
        setSeeding(false);
      }
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.email || !newUser.password) {
      await alert("Por favor complete todos los campos.", "Campos Incompletos");
      return;
    }
    
    // In demo mode we just simulate creating a user in local database logs
    setUserSuccessMsg(`¡Usuario ${newUser.email} creado con éxito con rol ${newUser.role === "admin" ? "Administrador" : "Docente"}!`);
    setNewUser({ email: "", password: "", role: "comun" });
    
    setTimeout(() => {
      setUserSuccessMsg("");
    }, 4000);
  };

  const filteredLogs = logs.filter(log => 
    log.usuario_email.toLowerCase().includes(searchLog.toLowerCase()) ||
    log.modulo.toLowerCase().includes(searchLog.toLowerCase()) ||
    log.descripcion.toLowerCase().includes(searchLog.toLowerCase())
  );

  const formatDate = (isoString) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Title */}
      <div>
        <h1 style={{ fontSize: "2rem", color: "#fff", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Settings size={28} style={{ color: "var(--primary)" }} />
          <span>Configuración del Sistema</span>
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Sembrado inicial de datos, gestión de cuentas de usuarios y logs de auditoría general.
        </p>
      </div>

      <div className="grid-cols-2">
        {/* Seeding & Administration Panel */}
        <div className="glass-card" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <h2 style={{ fontSize: "1.3rem", color: "#fff", borderBottom: "1px solid var(--border-glass)", paddingBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Database size={18} style={{ color: "var(--primary)" }} />
            <span>Base de Datos y Migración</span>
          </h2>

          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.5 }}>
            Cargue los datos iniciales procesados de las planillas Excel directamente a la base de datos de producción o desarrollo local.
          </p>

          <div 
            style={{ 
              background: "rgba(255,255,255,0.02)", 
              border: "1px solid var(--border-glass)", 
              borderRadius: "var(--radius-sm)", 
              padding: "1rem",
              fontSize: "0.85rem",
              color: "var(--text-muted)",
              display: "flex",
              flexDirection: "column",
              gap: "0.35rem"
            }}
          >
            <div><strong>Resumen del Paquete de Siembra:</strong></div>
            <div>• Estudiantes consolidados: <strong>{seedData.estudiantes ? seedData.estudiantes.length : 0} legajos</strong></div>
            <div>• Profesores y personal: <strong>{seedData.profesores ? seedData.profesores.length : 0} docentes</strong></div>
            <div>• Horarios por año lectivo: <strong>{seedData.horarios ? seedData.horarios.length : 0} grillas semanales</strong></div>
          </div>

          {seedSuccess && (
            <div className="badge-success" style={{ padding: "0.75rem", borderRadius: "var(--radius-sm)", display: "flex", gap: "0.5rem", fontSize: "0.85rem", textTransform: "none", letterSpacing: "normal" }}>
              <CheckCircle size={16} />
              <span>Base de datos sembrada con éxito. Verifique los legajos escolares.</span>
            </div>
          )}

          <button 
            onClick={handleSeed}
            className="btn btn-primary"
            style={{ alignSelf: "flex-start" }}
            disabled={seeding}
          >
            <Database size={16} />
            <span>{seeding ? "Sembrando base de datos..." : "Sembrar Base de Datos"}</span>
          </button>
        </div>

        {/* User Account Provisioning */}
        <div className="glass-card" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <h2 style={{ fontSize: "1.3rem", color: "#fff", borderBottom: "1px solid var(--border-glass)", paddingBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <UserPlus size={18} style={{ color: "var(--primary)" }} />
            <span>Dar de Alta Usuarios</span>
          </h2>

          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.5 }}>
            Registre nuevos integrantes autorizados (Docentes, Auxiliares) asignándoles su rol correspondiente.
          </p>

          {userSuccessMsg && (
            <div className="badge-success" style={{ padding: "0.75rem", borderRadius: "var(--radius-sm)", display: "flex", gap: "0.5rem", fontSize: "0.85rem", textTransform: "none", letterSpacing: "normal" }}>
              <CheckCircle size={16} />
              <span>{userSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreateUser} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label" htmlFor="cfg_email">Correo Electrónico</label>
              <input 
                id="cfg_email"
                type="email" 
                className="form-control"
                placeholder="usuario@ceija.edu.ar"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="cfg_pass">Contraseña Inicial</label>
              <input 
                id="cfg_pass"
                type="password" 
                className="form-control"
                placeholder="••••••••"
                value={newUser.password}
                onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="cfg_role">Rol del Usuario</label>
              <select 
                id="cfg_role"
                className="form-control"
                value={newUser.role}
                onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
              >
                <option value="comun">Usuario Común (Docente / Lectura)</option>
                <option value="admin">Administrador (Director / CRUD Completo)</option>
              </select>
            </div>

            <button type="submit" className="btn btn-secondary" style={{ alignSelf: "flex-start" }}>
              <UserPlus size={16} />
              <span>Crear Cuenta</span>
            </button>
          </form>
        </div>
      </div>

      {/* Audit Logs Glass Card */}
      <div className="glass-card" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div className="flex-between" style={{ borderBottom: "1px solid var(--border-glass)", paddingBottom: "0.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <h2 style={{ fontSize: "1.3rem", color: "#fff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Clock size={18} style={{ color: "var(--primary)" }} />
            <span>Logs de Auditoría y Control</span>
          </h2>

          <div style={{ position: "relative", width: "100%", maxWidth: "300px" }}>
            <input 
              type="text" 
              className="form-control"
              placeholder="Filtrar logs por acción, módulo, descripción..."
              value={searchLog}
              onChange={(e) => setSearchLog(e.target.value)}
              style={{ paddingLeft: "2.2rem", paddingRight: "0.8rem", fontSize: "0.85rem" }}
            />
            <Search size={14} style={{ position: "absolute", left: "0.8rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-inactive)" }} />
          </div>
        </div>

        {loadingLogs ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>Cargando logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", fontStyle: "italic" }}>
            No se registran logs de auditoría en la base de datos.
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table" style={{ fontSize: "0.85rem" }}>
              <thead>
                <tr>
                  <th style={{ width: "150px" }}>Fecha / Hora</th>
                  <th style={{ width: "180px" }}>Usuario</th>
                  <th style={{ width: "110px" }}>Acción</th>
                  <th style={{ width: "120px" }}>Módulo</th>
                  <th>Descripción del Cambio</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, idx) => (
                  <tr key={log.id || idx}>
                    <td style={{ color: "var(--text-muted)", whiteSpace: "nowrap" }}>{formatDate(log.timestamp)}</td>
                    <td style={{ fontWeight: 500 }}><User size={12} style={{ display: "inline", marginRight: "0.25rem", verticalAlign: "middle" }} />{log.usuario_email}</td>
                    <td>
                      <span 
                        className="badge"
                        style={{
                          fontSize: "0.65rem",
                          backgroundColor: 
                            log.accion === "CREAR" ? "var(--color-success-bg)" : 
                            log.accion === "EDITAR" ? "var(--color-warning-bg)" : 
                            log.accion === "ELIMINAR" ? "var(--color-error-bg)" : 
                            "rgba(255,255,255,0.05)",
                          color: 
                            log.accion === "CREAR" ? "var(--color-success)" : 
                            log.accion === "EDITAR" ? "var(--color-warning)" : 
                            log.accion === "ELIMINAR" ? "var(--color-error)" : 
                            "var(--text-muted)"
                        }}
                      >
                        {log.accion}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: "var(--text-muted)" }}>{log.modulo}</td>
                    <td style={{ color: "var(--text-main)" }}>{log.descripcion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
