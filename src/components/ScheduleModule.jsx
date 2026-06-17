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
  Plus,
  X,
  Clock,
  Grid
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

  // View Mode: 'grid' or 'timeline'
  const [viewMode, setViewMode] = useState("grid");
  
  // Map current day of week in Spanish
  const daysMap = {
    1: "Lunes",
    2: "Martes",
    3: "Miércoles",
    4: "Jueves",
    5: "Viernes"
  };
  const todayNum = new Date().getDay();
  const todayName = daysMap[todayNum];
  const [activeTimelineDay, setActiveTimelineDay] = useState(todayName || "Lunes");

  const isCurrentBlock = (inicio, fin) => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTotalMin = currentHour * 60 + currentMin;

    const parseTime = (timeStr) => {
      if (!timeStr) return 0;
      const [h, m] = timeStr.split(":").map(Number);
      return h * 60 + m;
    };

    const startTotal = parseTime(inicio);
    const endTotal = parseTime(fin);

    return currentTotalMin >= startTotal && currentTotalMin < endTotal;
  };

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

  // Simplified elegant colors
  const getSubjectColor = (subj) => {
    if (!subj || subj === "---------------") return "transparent";
    if (subj.toUpperCase() === "RECREO") return "rgba(0, 0, 0, 0.02)";
    return "rgba(139, 38, 53, 0.03)";
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

      {/* Tab Selectors & View Mode Toggle */}
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-glass)", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
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
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ display: "flex", background: "rgba(0,0,0,0.03)", padding: "0.25rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-glass)", gap: "0.25rem" }}>
            <button 
              onClick={() => setViewMode("grid")}
              style={{
                padding: "0.4rem 0.8rem",
                borderRadius: "4px",
                border: "none",
                cursor: "pointer",
                background: viewMode === "grid" ? "var(--color-ladrillo)" : "transparent",
                color: viewMode === "grid" ? "#fff" : "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                fontSize: "0.85rem",
                fontWeight: 600,
                transition: "all var(--transition-fast)"
              }}
            >
              <Grid size={14} />
              <span>Semanal (Grilla)</span>
            </button>
            <button 
              onClick={() => setViewMode("timeline")}
              style={{
                padding: "0.4rem 0.8rem",
                borderRadius: "4px",
                border: "none",
                cursor: "pointer",
                background: viewMode === "timeline" ? "var(--color-ladrillo)" : "transparent",
                color: viewMode === "timeline" ? "#fff" : "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                fontSize: "0.85rem",
                fontWeight: 600,
                transition: "all var(--transition-fast)"
              }}
            >
              <Clock size={14} />
              <span>Diario (Cronograma)</span>
            </button>
          </div>
          
          <div className="hide-mobile" style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            <span>Turno: <strong>Noche (18:50 hs - 22:30 hs)</strong></span>
          </div>
        </div>
      </div>

      {/* Pulse glow animation for timeline */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse-glow {
          0% { transform: scale(1); box-shadow: 0 0 0 rgba(21, 128, 61, 0.4); }
          100% { transform: scale(1.05); box-shadow: 0 0 8px rgba(21, 128, 61, 0.7); }
        }
      `}} />

      {/* Visual Schedule Grid / Timeline */}
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
          <div>
            {/* Timeline View Day Tabs */}
            {viewMode === "timeline" && (
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", overflowX: "auto", paddingBottom: "0.5rem", borderBottom: "1px solid var(--border-glass)" }}>
                {daysOfWeek.map((day) => {
                  const isToday = day === todayName;
                  const isActive = day === activeTimelineDay;
                  return (
                    <button
                      key={day}
                      onClick={() => setActiveTimelineDay(day)}
                      style={{
                        padding: "0.5rem 1rem",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        backgroundColor: isActive 
                          ? "var(--color-ladrillo)" 
                          : isToday 
                            ? "rgba(244, 180, 26, 0.15)" 
                            : "transparent",
                        borderColor: isActive 
                          ? "var(--color-ladrillo)" 
                          : isToday 
                            ? "var(--color-ocre)" 
                            : "var(--border-glass)",
                        color: isActive 
                          ? "#fff" 
                          : isToday 
                            ? "var(--color-ladrillo)" 
                            : "var(--text-muted)",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        whiteSpace: "nowrap",
                        transition: "all var(--transition-fast)"
                      }}
                    >
                      <span>{day}</span>
                      {isToday && (
                        <span style={{ fontSize: "0.65rem", backgroundColor: isActive ? "rgba(255,255,255,0.2)" : "var(--color-ocre)", color: isActive ? "#fff" : "var(--text-main)", padding: "0.05rem 0.3rem", borderRadius: "3px" }}>
                          Hoy
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {viewMode === "timeline" ? (
              /* VERTICAL TIMELINE VIEW */
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", position: "relative" }}>
                {/* Timeline vertical bar */}
                <div style={{
                  position: "absolute",
                  left: "95px",
                  top: "10px",
                  bottom: "10px",
                  width: "2px",
                  background: "var(--border-glass)",
                  zIndex: 0
                }} />

                {activeSchedule.bloques.map((block, bIdx) => {
                  const cell = block.dias ? block.dias[activeTimelineDay] : null;
                  const isRecreo = cell && cell.materia === "RECREO";
                  const materiaName = cell ? cell.materia : "---------------";
                  const teacherName = cell ? cell.profesor : "";
                  const isActiveNow = isCurrentBlock(block.inicio, block.fin) && (activeTimelineDay === todayName);

                  return (
                    <div 
                      key={bIdx} 
                      style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "1.5rem", 
                        zIndex: 1, 
                        position: "relative",
                        minHeight: "70px"
                      }}
                    >
                      {/* Left Side: Time */}
                      <div style={{ 
                        width: "80px", 
                        display: "flex", 
                        flexDirection: "column", 
                        alignItems: "flex-end", 
                        fontSize: "0.85rem",
                        color: isActiveNow ? "var(--color-ladrillo)" : "var(--text-muted)",
                        fontWeight: isActiveNow ? 700 : 500
                      }}>
                        <span style={{ color: "var(--text-main)" }}>{block.inicio}</span>
                        <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>{block.fin}</span>
                      </div>

                      {/* Timeline Dot */}
                      <div style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        background: isActiveNow ? "var(--color-ocre)" : "var(--bg-primary)",
                        border: `3px solid ${isActiveNow ? "var(--color-ladrillo)" : "var(--text-inactive)"}`,
                        boxShadow: isActiveNow ? "0 0 8px var(--color-ocre)" : "none",
                        marginRight: "0.25rem"
                      }} />

                      {/* Right Side: Block Card */}
                      <div 
                        className="glass-card animate-fade-in"
                        onClick={() => handleCellClick(bIdx, activeTimelineDay, cell)}
                        style={{
                          flexGrow: 1,
                          padding: isRecreo ? "0.6rem 1rem" : "0.9rem 1.2rem",
                          background: isActiveNow 
                            ? "rgba(244, 180, 26, 0.08)" 
                            : isRecreo 
                              ? "rgba(255,255,255,0.02)" 
                              : "rgba(139, 38, 53, 0.02)",
                          borderLeft: isRecreo 
                            ? "none" 
                            : `5px solid ${isActiveNow ? "var(--color-ocre)" : "var(--color-ladrillo)"}`,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          cursor: isAdmin ? "pointer" : "default",
                          boxShadow: isActiveNow ? "0 5px 15px rgba(244,180,26,0.15)" : "var(--shadow-premium)"
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                          {isRecreo ? (
                            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                              Recreo Escolar
                            </span>
                          ) : (
                            <>
                              <span style={{ fontSize: "1rem", fontWeight: 700, color: cell ? "var(--text-main)" : "var(--text-inactive)" }}>
                                {materiaName}
                              </span>
                              {teacherName && (
                                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                  Docente: <strong>{teacherName}</strong>
                                </span>
                              )}
                            </>
                          )}
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          {isActiveNow && (
                            <span 
                              className="badge badge-success" 
                              style={{ 
                                animation: "pulse-glow 1.5s infinite alternate",
                                fontSize: "0.65rem",
                                padding: "0.15rem 0.4rem" 
                              }}
                            >
                              En curso ahora
                            </span>
                          )}
                          {isAdmin && !isRecreo && (
                            <button 
                              type="button" 
                              className="btn btn-secondary" 
                              style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.25rem" }}
                            >
                              <Edit3 size={12} />
                              <span>Editar</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* WEEKLY GRID TABLE VIEW */
              <div className="table-container animate-fade-in">
                <table className="custom-table" style={{ tableLayout: "fixed" }}>
                  <thead>
                    <tr>
                      <th style={{ width: "110px" }}>Franja Horaria</th>
                      {daysOfWeek.map(d => {
                        const isToday = d === todayName;
                        return (
                          <th 
                            key={d} 
                            style={{ 
                              textAlign: "center",
                              background: isToday ? "rgba(244, 180, 26, 0.1)" : "var(--bg-secondary)",
                              borderBottom: isToday ? "3px solid var(--color-ocre)" : "1px solid var(--border-glass)",
                              color: isToday ? "var(--color-ladrillo)" : "var(--text-muted)"
                            }}
                          >
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.15rem" }}>
                              <span>{d}</span>
                              {isToday && (
                                <span 
                                  style={{ 
                                    fontSize: "0.6rem", 
                                    backgroundColor: "var(--color-ocre)", 
                                    color: "var(--text-main)", 
                                    padding: "0.05rem 0.35rem", 
                                    borderRadius: "4px", 
                                    fontWeight: 800,
                                    textTransform: "uppercase" 
                                  }}
                                >
                                  Hoy
                                </span>
                              )}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {activeSchedule.bloques.map((block, bIdx) => {
                      const isRecreoRow = block.dias && block.dias.Lunes && block.dias.Lunes.materia === "RECREO";

                      return (
                        <tr key={bIdx} style={{ height: isRecreoRow ? "40px" : "85px" }}>
                          <td style={{ verticalAlign: "middle", fontWeight: 600, borderRight: "1px solid var(--border-glass)" }}>
                            <div style={{ fontSize: "0.85rem", color: "var(--text-main)" }}>{block.inicio}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-inactive)" }}>{block.fin}</div>
                          </td>
                          
                          {isRecreoRow ? (
                            <td 
                              colSpan={5} 
                              style={{
                                textAlign: "center",
                                verticalAlign: "middle",
                                background: "rgba(0,0,0,0.02)",
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
                              const isClash = cell && cell.profesorDni === "Unknown Teacher";
                              
                              const isTodayColumn = day === todayName;
                              const hasMateria = cell && cell.materia && cell.materia !== "---------------";
                              const bgColor = isTodayColumn 
                                ? (hasMateria ? "rgba(244, 180, 26, 0.08)" : "rgba(244, 180, 26, 0.02)") 
                                : (hasMateria ? "rgba(139, 38, 53, 0.03)" : "transparent");
                              
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
                                    borderLeft: hasMateria 
                                      ? `4px solid ${isTodayColumn ? "var(--color-ocre)" : "var(--color-ladrillo)"}` 
                                      : "1px solid transparent",
                                    borderRight: isTodayColumn ? "1px solid rgba(244, 180, 26, 0.15)" : "none"
                                  }}
                                  onMouseEnter={(e) => {
                                    if (isAdmin) {
                                      e.currentTarget.style.borderColor = "var(--primary)";
                                      e.currentTarget.style.backgroundColor = "rgba(139,38,53,0.05)";
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
                                    <span style={{ fontSize: "0.85rem", fontWeight: cell ? 700 : 400, color: cell ? "var(--text-main)" : "var(--text-inactive)" }}>
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
                <X size={20} />
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
