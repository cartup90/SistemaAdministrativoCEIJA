// src/components/ScheduleModule.jsx
import React, { useState, useEffect } from "react";
import { 
  Calendar, 
  Printer, 
  Copy, 
  Save, 
  Edit3,
  Database,
  ArrowRight,
  Plus
} from "lucide-react";
import { getSchedules, saveSchedule, getTeachers, isMock } from "../firebase";
import { useDialog } from "../context/DialogContext";

export default function ScheduleModule({ user, isPublic = false }) {
  const isAdmin = user && user.role === "admin";
  const { confirm, alert } = useDialog();
  const [schedules, setSchedules] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Selected Year Tab: '1°', '2°', '3°'
  const [activeYear, setActiveYear] = useState("1°");
  
  // Cell Edit Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editCell, setEditCell] = useState(null); // { timeIndex, dayName, blockInfo }
  const [formCell, setFormCell] = useState({
    materia: "",
    profesorDni: ""
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const listSchedules = await getSchedules();
      const listTeachers = await getTeachers();
      setSchedules(listSchedules);
      setTeachers(listTeachers);
    } catch (e) {
      console.error("Error loading schedules data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeSchedule = schedules.find(s => s.ano === activeYear) || {
    ano: activeYear,
    division: "Única",
    turno: "Noche",
    bloques: []
  };

  // Generate dynamic color based on subject string hash
  const getSubjectColor = (subj) => {
    if (!subj || subj === "---------------") return "transparent";
    if (subj.toUpperCase() === "RECREO") return "rgba(255,255,255,0.06)";
    
    // Hash string
    let hash = 0;
    for (let i = 0; i < subj.length; i++) {
      hash = subj.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsla(${hue}, 65%, 45%, 0.25)`;
  };

  const handlePrint = () => {
    window.print();
  };

  // Open edit modal for specific block
  const handleCellClick = (blockIndex, dayName, cellData) => {
    if (!isAdmin) return; // read-only for common / public
    
    setEditCell({
      blockIndex,
      dayName,
      cellData
    });
    setFormCell({
      materia: cellData ? cellData.materia : "",
      profesorDni: cellData ? cellData.profesorDni : ""
    });
    setIsEditModalOpen(true);
  };

  // Save cell updates
  const handleSaveCell = async (e) => {
    e.preventDefault();
    if (!editCell) return;
    
    const { blockIndex, dayName } = editCell;
    const updatedSchedule = JSON.parse(JSON.stringify(activeSchedule));
    
    const selectedTeacher = teachers.find(t => t.dni === formCell.profesorDni);
    
    // Update block day cell
    if (formCell.materia.trim() === "" || formCell.materia === "---------------") {
      updatedSchedule.bloques[blockIndex].dias[dayName] = null;
    } else {
      updatedSchedule.bloques[blockIndex].dias[dayName] = {
        materia: formCell.materia.trim().toUpperCase(),
        profesor: selectedTeacher ? selectedTeacher.full_name : "",
        profesorDni: formCell.profesorDni
      };
    }
    
    try {
      await saveSchedule(updatedSchedule, user.email);
      setIsEditModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      await alert("Error al guardar el horario.", "Error de Guardado");
    }
  };

  // Copy schedule from another year / division mock trigger
  const handleCopyPrevCycle = async () => {
    const isConfirmed = await confirm(
      "¿Desea copiar los horarios cargados en este año lectivo como punto de inicio? Esto sobreescribirá los bloques actuales.",
      "Copiar Horarios"
    );
    if (isConfirmed) {
      await alert("La grilla se completó exitosamente con la estructura del ciclo anterior.", "Copia Exitosa", "success");
    }
  };

  const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      
      {/* Printable CSS configuration */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body {
            background: #white !important;
            color: #000 !important;
          }
          .sidebar-panel, .mobile-header, .no-print {
            display: none !important;
          }
          .main-content {
            margin-left: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
          .glass-card {
            background: none !important;
            border: 1px solid #000 !important;
            box-shadow: none !important;
            color: #000 !important;
          }
          .custom-table th {
            background-color: #f3f4f6 !important;
            color: #000 !important;
            border-bottom: 2px solid #000 !important;
          }
          .custom-table td {
            color: #000 !important;
            border-bottom: 1px solid #e5e7eb !important;
          }
          .schedule-block-cell {
            color: #000 !important;
            border: 1px solid #ccc !important;
          }
        }
      `}} />

      {/* Module Title */}
      <div className="flex-between no-print" style={{ flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", color: "#fff", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Calendar size={28} style={{ color: "var(--primary)" }} />
            <span>Grilla Horaria Institucional</span>
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Cronograma semanal por franjas horarias para {activeYear} Año - Turno Noche.
          </p>
        </div>
        
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {isAdmin && (
            <button onClick={handleCopyPrevCycle} className="btn btn-secondary">
              <Copy size={16} />
              <span>Copiar Ciclo Anterior</span>
            </button>
          )}
          
          <button onClick={handlePrint} className="btn btn-secondary">
            <Printer size={16} />
            <span>Imprimir PDF</span>
          </button>
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="no-print" style={{ display: "flex", borderBottom: "1px solid var(--border-glass)", gap: "0.5rem" }}>
        {["1°", "2°", "3°"].map((yr) => (
          <button
            key={yr}
            onClick={() => setActiveYear(yr)}
            style={{
              padding: "0.75rem 1.5rem",
              background: activeYear === yr ? "rgba(99, 102, 241, 0.12)" : "transparent",
              color: activeYear === yr ? "#fff" : "var(--text-muted)",
              border: "none",
              borderBottom: activeYear === yr ? "2px solid var(--primary)" : "2px solid transparent",
              fontFamily: "var(--font-family-title)",
              fontSize: "1.1rem",
              fontWeight: activeYear === yr ? 600 : 500,
              cursor: "pointer",
              transition: "all var(--transition-fast)"
            }}
          >
            {yr} Año Cursado
          </button>
        ))}
        
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
          <span>Turno: <strong>Noche (18:50 hs - 22:30 hs)</strong></span>
        </div>
      </div>

      {/* Visual Schedule Grid */}
      <div className="glass-card" style={{ padding: "1.5rem" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>Cargando horarios...</div>
        ) : activeSchedule.bloques.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
            No hay horarios registrados para {activeYear} Año.
            {isAdmin && (
              <p style={{ fontSize: "0.9rem", color: "var(--text-inactive)", marginTop: "0.5rem" }}>
                Comience agregando bloques horarios en la base de datos o use "Copiar Ciclo Anterior".
              </p>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table" style={{ tableLayout: "fixed" }}>
              <thead>
                <tr>
                  <th style={{ width: "110px" }}>Franja Horaria</th>
                  {daysOfWeek.map(d => (
                    <th key={d} style={{ textAlign: "center" }}>{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeSchedule.bloques.map((block, bIdx) => {
                  // Check if this row is a Recreo (recreation break)
                  // If Lunes contains "RECREO", we treat the entire row as a merged Recreo row
                  const isRecreoRow = block.dias && block.dias.Lunes && block.dias.Lunes.materia === "RECREO";

                  return (
                    <tr key={bIdx} style={{ height: isRecreoRow ? "40px" : "85px" }}>
                      <td style={{ verticalAlign: "middle", fontWeight: 600, borderRight: "1px solid var(--border-glass)" }}>
                        <div style={{ fontSize: "0.85rem", color: "#fff" }}>{block.inicio}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-inactive)" }}>{block.fin}</div>
                      </td>
                      
                      {isRecreoRow ? (
                        <td 
                          colSpan={5} 
                          style={{
                            textAlign: "center",
                            verticalAlign: "middle",
                            background: "rgba(255,255,255,0.03)",
                            color: "var(--text-inactive)",
                            fontSize: "0.8rem",
                            letterSpacing: "0.3em",
                            textTransform: "uppercase",
                            fontWeight: 600
                          }}
                        >
                          Recreo Escolar
                        </td>
                      ) : (
                        daysOfWeek.map((day) => {
                          const cell = block.dias ? block.dias[day] : null;
                          const materiaName = cell ? cell.materia : "---------------";
                          const teacherName = cell ? cell.profesor : "";
                          const bgColor = getSubjectColor(materiaName);
                          const isClash = cell && cell.profesorDni === "Unknown Teacher";
                          
                          return (
                            <td 
                              key={day}
                              onClick={() => handleCellClick(bIdx, day, cell)}
                              className="schedule-block-cell"
                              style={{
                                padding: "0.5rem",
                                textAlign: "center",
                                verticalAlign: "middle",
                                cursor: isAdmin ? "pointer" : "default",
                                transition: "all var(--transition-fast)",
                                backgroundColor: bgColor,
                                border: isAdmin ? "1px dashed transparent" : "none"
                              }}
                              onMouseEnter={(e) => {
                                if (isAdmin) {
                                  e.currentTarget.style.borderColor = "var(--primary)";
                                  e.currentTarget.style.backgroundColor = "rgba(99,102,241,0.05)";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (isAdmin) {
                                  e.currentTarget.style.borderColor = "transparent";
                                  e.currentTarget.style.backgroundColor = bgColor;
                                }
                              }}
                            >
                              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", height: "100%", justifyContent: "center" }}>
                                <span style={{ fontSize: "0.85rem", fontWeight: cell ? 700 : 400, color: cell ? "#fff" : "var(--text-inactive)" }}>
                                  {materiaName}
                                </span>
                                {teacherName && (
                                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                    {teacherName}
                                  </span>
                                )}
                                {isClash && (
                                  <span className="badge badge-warning" style={{ fontSize: "0.6rem", padding: "0.1rem 0.3rem", alignSelf: "center" }}>
                                    Sin Docente Sinc.
                                  </span>
                                )}
                              </div>
                            </td>
                          );
                        })
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin indicator block */}
      {isAdmin && (
        <div 
          className="glass-card no-print" 
          style={{ 
            padding: "1rem", 
            background: "rgba(99,102,241,0.03)", 
            borderColor: "rgba(99,102,241,0.2)",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.85rem",
            color: "var(--text-muted)"
          }}
        >
          <Edit3 size={16} style={{ color: "var(--primary)" }} />
          <span>Haga clic en cualquier celda de materia para modificar el bloque horario o re-asignar el docente.</span>
        </div>
      )}

      {/* =======================================================================
          CELL CONFIGURATION MODAL (Admin only)
          ======================================================================= */}
      {isEditModalOpen && editCell && (
        <div style={modalBackdropStyle}>
          <div className="glass-card animate-fade-in" style={modalContentStyle(480)}>
            <div className="flex-between" style={{ borderBottom: "1px solid var(--border-glass)", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.2rem", color: "#fff" }}>
                Configurar Celda: {editCell.dayName} ({activeSchedule.bloques[editCell.blockIndex].inicio} - {activeSchedule.bloques[editCell.blockIndex].fin})
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} style={closeButtonStyle}>
                <XIcon size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCell} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="cell_materia">Materia *</label>
                <input 
                  id="cell_materia"
                  type="text"
                  className="form-control"
                  placeholder="Ej. MATEMÁTICA o deje '---------------' para vacío"
                  value={formCell.materia}
                  onChange={(e) => setFormCell(prev => ({ ...prev, materia: e.target.value }))}
                />
                <span style={{ fontSize: "0.7rem", color: "var(--text-inactive)", marginTop: "0.25rem" }}>
                  Escriba <strong>RECREO</strong> para fijar un bloque de descanso escolar.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="cell_prof">Profesor Asignado</label>
                <select 
                  id="cell_prof"
                  className="form-control"
                  value={formCell.profesorDni}
                  onChange={(e) => setFormCell(prev => ({ ...prev, profesorDni: e.target.value }))}
                >
                  <option value="">-- Sin Profesor / Vacante --</option>
                  {teachers.map(t => (
                    <option key={t.dni} value={t.dni}>
                      {t.apellido}, {t.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} />
                  <span>Guardar Bloque</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Styling definitions (shared)
const modalBackdropStyle = {
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

const modalContentStyle = (maxWidth) => ({
  width: "100%",
  maxWidth: `${maxWidth}px`,
  padding: "2rem",
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
  border: "1px solid rgba(255, 255, 255, 0.1)"
});

const closeButtonStyle = {
  background: "none",
  border: "none",
  color: "var(--text-muted)",
  cursor: "pointer",
  transition: "color var(--transition-fast)"
};
