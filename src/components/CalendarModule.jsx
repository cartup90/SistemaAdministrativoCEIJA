// src/components/CalendarModule.jsx
import React, { useState, useEffect } from "react";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  X, 
  Search, 
  Filter, 
  Info, 
  BookOpen, 
  Star, 
  Sun, 
  Snowflake, 
  GraduationCap, 
  Flag, 
  Clock,
  Sparkles
} from "lucide-react";
import { getCustomEvents, saveCustomEvent, deleteCustomEvent } from "../firebase";

// ============================================================================
// CALENDAR DATA — Extracted from RES. MINISTERIAL NRO. 297-2025
// ============================================================================

const TIPOS = {
  INSTITUCIONAL: "Institucional",
  EFEMERIDE: "Efeméride",
  RECESO: "Receso / Descanso",
  EXAMEN: "Exámenes",
  FORMACION: "Formación Docente",
  PERSONALIZADO: "Personalizado"
};

const TIPO_COLORS = {
  [TIPOS.INSTITUCIONAL]: { bg: "rgba(139, 38, 53, 0.1)", color: "#8B2635", border: "rgba(139, 38, 53, 0.25)" },
  [TIPOS.EFEMERIDE]: { bg: "rgba(99, 102, 241, 0.08)", color: "#6366f1", border: "rgba(99, 102, 241, 0.2)" },
  [TIPOS.RECESO]: { bg: "rgba(16, 185, 129, 0.08)", color: "#15803d", border: "rgba(16, 185, 129, 0.2)" },
  [TIPOS.EXAMEN]: { bg: "rgba(244, 180, 26, 0.1)", color: "#b45309", border: "rgba(244, 180, 26, 0.25)" },
  [TIPOS.FORMACION]: { bg: "rgba(168, 85, 247, 0.08)", color: "#7c3aed", border: "rgba(168, 85, 247, 0.2)" },
  [TIPOS.PERSONALIZADO]: { bg: "rgba(244, 180, 26, 0.12)", color: "#d97706", border: "rgba(244, 180, 26, 0.35)" }
};

const calendarData = [
  // FEBRERO
  { mes: "Febrero", fecha: "18/02/2026", titulo: "Reintegro del equipo directivo y docente", tipo: TIPOS.INSTITUCIONAL, startDate: "2026-02-18", endDate: "2026-02-18" },
  { mes: "Febrero", fecha: "19 y 20/02/2026", titulo: "Formación Situada: Organización Pedagógico Institucional", tipo: TIPOS.FORMACION, startDate: "2026-02-19", endDate: "2026-02-20" },
  { mes: "Febrero", fecha: "23/02 al 13/03/2026", titulo: "Exámenes previos y equivalentes", tipo: TIPOS.EXAMEN, startDate: "2026-02-23", endDate: "2026-03-13" },
  { mes: "Febrero", fecha: "26 y 27/02/2026", titulo: "Período de ambientación para estudiantes que ingresan por primera vez", tipo: TIPOS.INSTITUCIONAL, startDate: "2026-02-26", endDate: "2026-02-27" },

  // MARZO
  { mes: "Marzo", fecha: "02/03/2026", titulo: "Inicio del ciclo lectivo — Inicio de clases para todos los niveles y modalidades", tipo: TIPOS.INSTITUCIONAL, startDate: "2026-03-02", endDate: "2026-03-02" },
  { mes: "Marzo", fecha: "12/03", titulo: "Día del Escudo Nacional", tipo: TIPOS.EFEMERIDE, startDate: "2026-03-12", endDate: "2026-03-12" },
  { mes: "Marzo", fecha: "24/03", titulo: "Día Nacional de la Memoria por la Verdad y la Justicia", tipo: TIPOS.EFEMERIDE, startDate: "2026-03-24", endDate: "2026-03-24" },

  // ABRIL
  { mes: "Abril", fecha: "02/04", titulo: "Día del Veterano/a de Guerra y Caídos en la Guerra de Malvinas", tipo: TIPOS.EFEMERIDE, startDate: "2026-04-02", endDate: "2026-04-02" },
  { mes: "Abril", fecha: "19/04", titulo: "Día de la Convivencia en la Diversidad Cultural", tipo: TIPOS.EFEMERIDE, startDate: "2026-04-19", endDate: "2026-04-19" },

  // MAYO
  { mes: "Mayo", fecha: "01/05", titulo: "Día Internacional de los/as Trabajadores/as", tipo: TIPOS.EFEMERIDE, startDate: "2026-05-01", endDate: "2026-05-01" },
  { mes: "Mayo", fecha: "01/05", titulo: "Día de la Constitución Nacional y de la Constitución Provincial de Córdoba", tipo: TIPOS.EFEMERIDE, startDate: "2026-05-01", endDate: "2026-05-01" },
  { mes: "Mayo", fecha: "02/05", titulo: "Día Internacional contra el Bullying o el Acoso Escolar", tipo: TIPOS.EFEMERIDE, startDate: "2026-05-02", endDate: "2026-05-02" },
  { mes: "Mayo", fecha: "11/05", titulo: "Día del Himno Nacional Argentino", tipo: TIPOS.EFEMERIDE, startDate: "2026-05-11", endDate: "2026-05-11" },
  { mes: "Mayo", fecha: "18/05", titulo: "Día de la Escarapela Nacional", tipo: TIPOS.EFEMERIDE, startDate: "2026-05-18", endDate: "2026-05-18" },
  { mes: "Mayo", fecha: "25/05", titulo: "Aniversario de la Revolución de Mayo", tipo: TIPOS.EFEMERIDE, startDate: "2026-05-25", endDate: "2026-05-25" },
  { mes: "Mayo", fecha: "29/05", titulo: "Día del Cordobazo y de las Luchas Populares", tipo: TIPOS.EFEMERIDE, startDate: "2026-05-29", endDate: "2026-05-29" },

  // JUNIO
  { mes: "Junio", fecha: "05/06", titulo: "Día Mundial del Ambiente", tipo: TIPOS.EFEMERIDE, startDate: "2026-06-05", endDate: "2026-06-05" },
  { mes: "Junio", fecha: "10/06", titulo: "Día de la Afirmación de los Derechos Argentinos sobre las Islas Malvinas", tipo: TIPOS.EFEMERIDE, startDate: "2026-06-10", endDate: "2026-06-10" },
  { mes: "Junio", fecha: "15/06", titulo: "Día Nacional del Libro", tipo: TIPOS.EFEMERIDE, startDate: "2026-06-15", endDate: "2026-06-15" },
  { mes: "Junio", fecha: "17/06", titulo: "Día Nacional de la Libertad Latinoamericana", tipo: TIPOS.EFEMERIDE, startDate: "2026-06-17", endDate: "2026-06-17" },
  { mes: "Junio", fecha: "20/06", titulo: "Día de la Bandera Nacional", tipo: TIPOS.EFEMERIDE, startDate: "2026-06-20", endDate: "2026-06-20" },
  { mes: "Junio", fecha: "21 al 24/06", titulo: "Nuevo Ciclo Indígena / Año Nuevo de los Pueblos Indígenas", tipo: TIPOS.EFEMERIDE, startDate: "2026-06-21", endDate: "2026-06-24" },

  // JULIO
  { mes: "Julio", fecha: "06 al 17/07/2026", titulo: "Receso escolar de invierno", tipo: TIPOS.RECESO, startDate: "2026-07-06", endDate: "2026-07-17" },
  { mes: "Julio", fecha: "06/07", titulo: "Aniversario de la Fundación de la Ciudad de Córdoba", tipo: TIPOS.EFEMERIDE, startDate: "2026-07-06", endDate: "2026-07-06" },
  { mes: "Julio", fecha: "09/07", titulo: "Aniversario de la Declaración de la Independencia Nacional", tipo: TIPOS.EFEMERIDE, startDate: "2026-07-09", endDate: "2026-07-09" },

  // AGOSTO
  { mes: "Agosto", fecha: "10/08/2026", titulo: "Inicio del segundo cuatrimestre (Régimen Especial)", tipo: TIPOS.INSTITUCIONAL, startDate: "2026-08-10", endDate: "2026-08-10" },
  { mes: "Agosto", fecha: "09/08", titulo: "Día Nacional de la Educación Especial / Día Internacional de los Pueblos Indígenas", tipo: TIPOS.EFEMERIDE, startDate: "2026-08-09", endDate: "2026-08-09" },
  { mes: "Agosto", fecha: "17/08", titulo: "Paso a la Inmortalidad del Gral. José de San Martín", tipo: TIPOS.EFEMERIDE, startDate: "2026-08-17", endDate: "2026-08-17" },
  { mes: "Agosto", fecha: "22/08", titulo: "Día del Folklore Argentino", tipo: TIPOS.EFEMERIDE, startDate: "2026-08-22", endDate: "2026-08-22" },

  // SEPTIEMBRE
  { mes: "Septiembre", fecha: "11/09", titulo: "Día del/de la Maestro/a", tipo: TIPOS.EFEMERIDE, startDate: "2026-09-11", endDate: "2026-09-11" },
  { mes: "Septiembre", fecha: "16/09", titulo: "La Noche de los Lápices — Día Nacional de la Juventud", tipo: TIPOS.EFEMERIDE, startDate: "2026-09-16", endDate: "2026-09-16" },
  { mes: "Septiembre", fecha: "17/09", titulo: "Día del/de la Profesor/a", tipo: TIPOS.EFEMERIDE, startDate: "2026-09-17", endDate: "2026-09-17" },
  { mes: "Septiembre", fecha: "21/09", titulo: "Día de las/os Estudiantes — Día Internacional de la Paz", tipo: TIPOS.EFEMERIDE, startDate: "2026-09-21", endDate: "2026-09-21" },
  { mes: "Septiembre", fecha: "27/09", titulo: "Día Nacional de los Derechos de Niñas/os y Adolescentes", tipo: TIPOS.EFEMERIDE, startDate: "2026-09-27", endDate: "2026-09-27" },

  // OCTUBRE
  { mes: "Octubre", fecha: "05/10", titulo: "Día del Camino y de la Educación Vial", tipo: TIPOS.EFEMERIDE, startDate: "2026-10-05", endDate: "2026-10-05" },
  { mes: "Octubre", fecha: "12/10", titulo: "Día del Respeto a la Diversidad Cultural", tipo: TIPOS.EFEMERIDE, startDate: "2026-10-12", endDate: "2026-10-12" },
  { mes: "Octubre", fecha: "15/10", titulo: "Día de la Cooperación Escolar", tipo: TIPOS.EFEMERIDE, startDate: "2026-10-15", endDate: "2026-10-15" },

  // NOVIEMBRE
  { mes: "Noviembre", fecha: "06/11", titulo: "Día de los Parques Nacionales", tipo: TIPOS.EFEMERIDE, startDate: "2026-11-06", endDate: "2026-11-06" },
  { mes: "Noviembre", fecha: "10/11", titulo: "Día de la Tradición", tipo: TIPOS.EFEMERIDE, startDate: "2026-11-10", endDate: "2026-11-10" },
  { mes: "Noviembre", fecha: "15/11", titulo: "Día de la Educación Técnica", tipo: TIPOS.EFEMERIDE, startDate: "2026-11-15", endDate: "2026-11-15" },
  { mes: "Noviembre", fecha: "20/11", titulo: "Día de la Soberanía Nacional", tipo: TIPOS.EFEMERIDE, startDate: "2026-11-20", endDate: "2026-11-20" },
  { mes: "Noviembre", fecha: "25/11", titulo: "Día Internacional de la Eliminación de la Violencia contra la Mujer", tipo: TIPOS.EFEMERIDE, startDate: "2026-11-25", endDate: "2026-11-25" },
  { mes: "Noviembre", fecha: "27/11", titulo: "Día de la Educación de Jóvenes y Adultos", tipo: TIPOS.EFEMERIDE, startDate: "2026-11-27", endDate: "2026-11-27" },
  { mes: "Noviembre", fecha: "27/11/2026", titulo: "Finalización del ciclo lectivo — Nivel Superior", tipo: TIPOS.INSTITUCIONAL, startDate: "2026-11-27", endDate: "2026-11-27" },

  // DICIEMBRE
  { mes: "Diciembre", fecha: "03/12", titulo: "Día Internacional de las Personas con Discapacidad", tipo: TIPOS.EFEMERIDE, startDate: "2026-12-03", endDate: "2026-12-03" },
  { mes: "Diciembre", fecha: "10/12", titulo: "Día Internacional de los Derechos Humanos — Día de la Restauración de la Democracia", tipo: TIPOS.EFEMERIDE, startDate: "2026-12-10", endDate: "2026-12-10" },
  { mes: "Diciembre", fecha: "18/12/2026", titulo: "Finalización del ciclo lectivo — Nivel Inicial, Primario, Secundario y Modalidades", tipo: TIPOS.INSTITUCIONAL, startDate: "2026-12-18", endDate: "2026-12-18" },
  { mes: "Diciembre", fecha: "21 al 29/12/2026", titulo: "Coloquios y exámenes previos y equivalentes", tipo: TIPOS.EXAMEN, startDate: "2026-12-21", endDate: "2026-12-29" },
  { mes: "Diciembre", fecha: "30/11 al 29/12/2026", titulo: "Exámenes y evaluación institucional", tipo: TIPOS.EXAMEN, startDate: "2026-11-30", endDate: "2026-12-29" },
  { mes: "Diciembre", fecha: "22/12/2026 al 06/01/2027", titulo: "Receso escolar de verano", tipo: TIPOS.RECESO, startDate: "2026-12-22", endDate: "2027-01-06" }
];

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const DAYS_OF_WEEK = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const DAYS_OF_WEEK_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default function CalendarModule({ user }) {
  const [customEvents, setCustomEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState("");

  const now = new Date();
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonthIdx, setCurrentMonthIdx] = useState(now.getFullYear() === 2026 ? now.getMonth() : 5); // Default to June (5) or current month

  // Selected cell for Modal
  const [selectedCell, setSelectedCell] = useState(null);

  // New Event Form State
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventTipo, setNewEventTipo] = useState(TIPOS.PERSONALIZADO);
  const [newEventEndDate, setNewEventEndDate] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [deleteConfirmEventId, setDeleteConfirmEventId] = useState(null);

  const isAdmin = user?.role === "admin";

  const loadData = async () => {
    setLoading(true);
    try {
      const events = await getCustomEvents();
      setCustomEvents(events || []);
    } catch (e) {
      console.error("Error loading custom events:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePrevMonth = () => {
    setCurrentMonthIdx(prev => {
      if (prev === 0) {
        setCurrentYear(y => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonthIdx(prev => {
      if (prev === 11) {
        setCurrentYear(y => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  // Construct monthly calendar grid cells
  const firstDayOfWeek = new Date(currentYear, currentMonthIdx, 1).getDay(); // 0 = Sunday, 1 = Monday...
  const daysInMonth = new Date(currentYear, currentMonthIdx + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonthIdx, 0).getDate();

  const cells = [];

  // Add padding days from the previous month
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const m = currentMonthIdx === 0 ? 11 : currentMonthIdx - 1;
    const y = currentMonthIdx === 0 ? currentYear - 1 : currentYear;
    cells.push({
      dayNum: d,
      isCurrentMonth: false,
      dateStr: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    });
  }

  // Add days of the current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      dayNum: d,
      isCurrentMonth: true,
      dateStr: `${currentYear}-${String(currentMonthIdx + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    });
  }

  // Add padding days for the next month to complete the grid rows
  const totalCells = cells.length > 35 ? 42 : 35;
  const remaining = totalCells - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const m = currentMonthIdx === 11 ? 0 : currentMonthIdx + 1;
    const y = currentMonthIdx === 11 ? currentYear + 1 : currentYear;
    cells.push({
      dayNum: d,
      isCurrentMonth: false,
      dateStr: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    });
  }

  // Merge official data and custom events
  const allEvents = [...calendarData, ...customEvents];

  // Get matching events for a specific cell
  const getCellEvents = (cell) => {
    return allEvents.filter(event => {
      const matchesSearch = !searchTerm || 
        event.titulo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTipo = !tipoFilter || event.tipo === tipoFilter;
      const fallsOnDay = cell.dateStr >= event.startDate && cell.dateStr <= event.endDate;
      return matchesSearch && matchesTipo && fallsOnDay;
    });
  };

  // Handle Event Creation
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!newEventTitle.trim()) {
      setFormError("El título del evento es obligatorio.");
      return;
    }

    const eventToSave = {
      titulo: newEventTitle.trim(),
      tipo: newEventTipo,
      startDate: selectedCell.dateStr,
      endDate: newEventEndDate || selectedCell.dateStr,
      mes: MONTHS[new Date(selectedCell.dateStr + "T00:00:00").getMonth()],
      fecha: new Date(selectedCell.dateStr + "T00:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })
    };

    try {
      await saveCustomEvent(eventToSave, user?.email || "admin@ceija.edu.ar");
      setNewEventTitle("");
      setNewEventEndDate("");
      setFormSuccess("¡Evento guardado con éxito!");
      
      // Reload custom events
      const events = await getCustomEvents();
      setCustomEvents(events || []);

      // Update current selected cell events list
      const updatedCell = { ...selectedCell };
      setSelectedCell(updatedCell);
    } catch (err) {
      console.error(err);
      setFormError("Hubo un error al guardar el evento.");
    }
  };

  // Handle Event Deletion
  const handleDeleteEvent = async (eventId) => {
    try {
      await deleteCustomEvent(eventId, user?.email || "admin@ceija.edu.ar");
      setDeleteConfirmEventId(null);
      
      // Reload custom events
      const events = await getCustomEvents();
      setCustomEvents(events || []);

      // Trigger update to modal list
      if (selectedCell) {
        setSelectedCell({ ...selectedCell });
      }
    } catch (err) {
      console.error(err);
      alert("Hubo un error al eliminar el evento.");
    }
  };

  // Format date nicely for header (e.g. "Lunes 29 de Junio, 2026")
  const formatCellDate = (dateStr) => {
    if (!dateStr) return "";
    const dateObj = new Date(dateStr + "T00:00:00");
    const weekday = DAYS_OF_WEEK[dateObj.getDay()];
    const day = dateObj.getDate();
    const month = MONTHS[dateObj.getMonth()];
    const year = dateObj.getFullYear();
    return `${weekday} ${day} de ${month}, ${year}`;
  };

  // Count active filter events in the current month view
  const currentMonthCells = cells.filter(c => c.isCurrentMonth);
  const currentMonthEventsCount = currentMonthCells.reduce((total, c) => {
    return total + getCellEvents(c).length;
  }, 0);

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Styles local setup */}
      <style dangerouslySetInnerHTML={{__html: `
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          background: var(--border-glass);
          border: 1px solid var(--border-glass);
          border-radius: var(--radius-md);
          overflow: hidden;
          box-shadow: var(--shadow-md);
        }
        .calendar-header-cell {
          text-align: center;
          padding: 0.75rem 0.5rem;
          font-weight: 700;
          font-size: 0.8rem;
          text-transform: uppercase;
          color: var(--text-muted);
          background: rgba(255, 255, 255, 0.03);
          border-bottom: 1px solid var(--border-glass);
          letter-spacing: 0.05em;
        }
        .calendar-day-cell {
          height: 110px;
          min-width: 0;
          background: rgba(255, 255, 255, 0.01);
          border-right: 1px solid var(--border-glass);
          border-bottom: 1px solid var(--border-glass);
          padding: 0.4rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          position: relative;
          transition: background var(--transition-fast) ease;
          overflow: hidden;
        }
        .calendar-day-cell:nth-child(7n) {
          border-right: none;
        }
        .calendar-day-cell.other-month {
          background: rgba(0, 0, 0, 0.12);
          opacity: 0.45;
        }
        .calendar-day-cell.active-month {
          cursor: pointer;
        }
        .calendar-day-cell.active-month:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        .calendar-day-cell.today {
          background: rgba(139, 38, 53, 0.05);
          box-shadow: inset 0 0 0 1.5px var(--color-ladrillo);
        }
        .calendar-day-num {
          font-weight: 700;
          font-size: 0.85rem;
          color: var(--text-muted);
          align-self: flex-end;
          margin-bottom: 0.2rem;
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }
        .calendar-day-cell.today .calendar-day-num {
          background: var(--color-ladrillo);
          color: #fff;
        }
        .calendar-event-badge {
          font-size: 0.68rem;
          font-weight: 600;
          padding: 0.15rem 0.35rem;
          border-radius: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.2;
          width: 100%;
          border: 1px solid transparent;
        }
        .calendar-more-indicator {
          font-size: 0.65rem;
          font-weight: 700;
          color: var(--text-inactive);
          text-align: center;
          padding: 0.1rem;
        }
        .modal-calendar-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }
        .modal-calendar-box {
          width: 100%;
          max-width: 580px;
          max-height: 90vh;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          border-radius: var(--radius-md);
        }
        @media (max-width: 768px) {
          .calendar-day-cell {
            height: 80px;
          }
          .calendar-event-badge {
            font-size: 0.58rem;
            padding: 0.1rem 0.25rem;
          }
          .calendar-day-num {
            font-size: 0.75rem;
            width: 18px;
            height: 18px;
          }
        }
      `}} />

      {/* Header */}
      <div className="flex-between" style={{ flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <CalendarIcon size={28} style={{ color: "var(--color-ladrillo)" }} />
            <span>Calendario Escolar 2026</span>
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Hacé clic en cualquier casillero para ver los detalles del día o agendar fechas importantes.
          </p>
        </div>
        
        {/* Navigation Selector */}
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button onClick={handlePrevMonth} className="btn btn-secondary" style={{ padding: "0.5rem" }}>
            <ChevronLeft size={18} />
          </button>
          
          <div style={{ position: "relative", display: "flex", gap: "0.25rem" }}>
            <select 
              value={currentMonthIdx} 
              onChange={(e) => setCurrentMonthIdx(parseInt(e.target.value))}
              className="form-control"
              style={{ padding: "0.45rem 1.75rem 0.45rem 0.75rem", fontSize: "0.9rem", fontWeight: 700, width: "130px", margin: 0 }}
            >
              {MONTHS.map((m, idx) => (
                <option key={idx} value={idx}>{m}</option>
              ))}
            </select>

            <select 
              value={currentYear} 
              onChange={(e) => setCurrentYear(parseInt(e.target.value))}
              className="form-control"
              style={{ padding: "0.45rem 1.75rem 0.45rem 0.75rem", fontSize: "0.9rem", fontWeight: 700, width: "90px", margin: 0 }}
            >
              {[2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <button onClick={handleNextMonth} className="btn btn-secondary" style={{ padding: "0.5rem" }}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-card" style={{ padding: "1rem 1.25rem", display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end" }}>
        <div className="form-group" style={{ flexGrow: 1, minWidth: "200px", marginBottom: 0 }}>
          <label className="form-label" htmlFor="cal_search">Buscar Evento</label>
          <div style={{ position: "relative" }}>
            <input
              id="cal_search"
              type="text"
              className="form-control"
              placeholder="Buscar por palabra clave..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: "2.5rem" }}
            />
            <Search size={16} style={{ position: "absolute", left: "0.9rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-inactive)" }} />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-inactive)", cursor: "pointer" }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="form-group" style={{ width: "180px", marginBottom: 0 }}>
          <label className="form-label" htmlFor="cal_tipo">
            <Filter size={12} style={{ display: "inline", marginRight: "0.25rem" }} />
            Tipo de Evento
          </label>
          <select id="cal_tipo" className="form-control" value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)}>
            <option value="">Todos</option>
            {Object.values(TIPOS).map(tipo => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid Stats */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", color: "var(--text-muted)", padding: "0 0.25rem" }}>
        <div>
          <span>Vista de: <strong>{MONTHS[currentMonthIdx]} de {currentYear}</strong></span>
        </div>
        <div>
          <span>{currentMonthEventsCount} evento{currentMonthEventsCount !== 1 ? "s" : ""} coincidente{currentMonthEventsCount !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="calendar-grid">
        {/* Days Headers */}
        {DAYS_OF_WEEK_SHORT.map((day) => (
          <div key={day} className="calendar-header-cell">
            {day}
          </div>
        ))}

        {/* Days Cells */}
        {cells.map((cell, idx) => {
          const events = getCellEvents(cell);
          const cellTodayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
          const isToday = cell.dateStr === cellTodayStr;
          
          return (
            <div
              key={idx}
              onClick={() => cell.isCurrentMonth && setSelectedCell(cell)}
              className={`calendar-day-cell ${cell.isCurrentMonth ? "active-month" : "other-month"} ${isToday ? "today" : ""}`}
            >
              <span className="calendar-day-num">{cell.dayNum}</span>
              
              {/* Event indicators inside the cell */}
              <div style={{ display: "flex", flexDirection: "column", gap: "2px", width: "100%", overflow: "hidden" }}>
                {events.slice(0, 3).map((event, eventIdx) => {
                  const colors = TIPO_COLORS[event.tipo] || TIPO_COLORS[TIPOS.EFEMERIDE];
                  return (
                    <div
                      key={eventIdx}
                      className="calendar-event-badge"
                      style={{
                        backgroundColor: colors.bg,
                        color: colors.color,
                        borderColor: colors.border
                      }}
                      title={event.titulo}
                    >
                      {event.titulo}
                    </div>
                  );
                })}
                {events.length > 3 && (
                  <div className="calendar-more-indicator">
                    +{events.length - 3} más
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="glass-card" style={{ padding: "0.75rem 1rem", display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "center" }}>
        {Object.entries(TIPOS).map(([key, label]) => {
          const colors = TIPO_COLORS[label];
          return (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.78rem", fontWeight: 600 }}>
              <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", backgroundColor: colors.bg, border: `1px solid ${colors.border}` }} />
              <span style={{ color: "var(--text-muted)" }}>{label}</span>
            </div>
          );
        })}
      </div>

      {/* Modal: Day details and event creation */}
      {selectedCell && (
        <div className="modal-calendar-overlay" onClick={() => { setSelectedCell(null); setFormError(""); setFormSuccess(""); }}>
          <div 
            className="modal-calendar-box glass-card animate-fade-in" 
            onClick={(e) => e.stopPropagation()}
            style={{ padding: "2rem" }}
          >
            {/* Modal Header */}
            <div className="flex-between" style={{ borderBottom: "1px solid var(--border-glass)", paddingBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <CalendarIcon size={20} style={{ color: "var(--color-ladrillo)" }} />
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0, color: "var(--text-main)" }}>
                  Detalles del Día
                </h3>
              </div>
              <button 
                onClick={() => { setSelectedCell(null); setFormError(""); setFormSuccess(""); }} 
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Selected Date Header */}
            <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--color-ocre)", marginTop: "-0.5rem" }}>
              {formatCellDate(selectedCell.dateStr)}
            </div>

            {/* Events List for that day */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-muted)", margin: 0 }}>
                Eventos Programados
              </h4>
              
              {getCellEvents(selectedCell).length === 0 ? (
                <div style={{ padding: "1.5rem", textAlign: "center", border: "1px dashed var(--border-glass)", borderRadius: "var(--radius-sm)", color: "var(--text-inactive)", fontSize: "0.85rem" }}>
                  <Info size={16} style={{ display: "inline", marginRight: "0.25rem", verticalAlign: "middle" }} />
                  <span>No hay eventos agendados para este día.</span>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {getCellEvents(selectedCell).map((event, idx) => {
                    const colors = TIPO_COLORS[event.tipo] || TIPO_COLORS[TIPOS.EFEMERIDE];
                    const isCustom = !!event.id; // custom events have an ID
                    
                    return (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "1rem",
                          padding: "0.75rem 1rem",
                          borderRadius: "var(--radius-sm)",
                          background: colors.bg,
                          border: `1px solid ${colors.border}`
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                          <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-main)" }}>
                            {event.titulo}
                          </span>
                          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                            Tipo: {event.tipo} {event.startDate !== event.endDate && `(Desde ${event.startDate} al ${event.endDate})`}
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          {isCustom && isAdmin && (
                            <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
                              {deleteConfirmEventId === event.id ? (
                                <>
                                  <button
                                    onClick={() => handleDeleteEvent(event.id)}
                                    style={{
                                      background: "#ef4444",
                                      border: "none",
                                      color: "#fff",
                                      padding: "0.25rem 0.5rem",
                                      borderRadius: "4px",
                                      cursor: "pointer",
                                      fontSize: "0.75rem",
                                      fontWeight: "700"
                                    }}
                                    id={`confirm_del_${event.id}`}
                                  >
                                    Confirmar
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmEventId(null)}
                                    style={{
                                      background: "rgba(255, 255, 255, 0.1)",
                                      border: "1px solid var(--border-glass)",
                                      color: "var(--text-muted)",
                                      padding: "0.25rem 0.5rem",
                                      borderRadius: "4px",
                                      cursor: "pointer",
                                      fontSize: "0.75rem"
                                    }}
                                  >
                                    No
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => setDeleteConfirmEventId(event.id)}
                                  style={{
                                    background: "rgba(220, 38, 38, 0.1)",
                                    border: "1px solid rgba(220, 38, 38, 0.25)",
                                    color: "#ef4444",
                                    padding: "0.3rem",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center"
                                  }}
                                  title="Eliminar evento personalizado"
                                  id={`delete_btn_${event.id}`}
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Form to Add Event (Only for Admin) */}
            {isAdmin && (
              <div 
                style={{ 
                  borderTop: "1px solid var(--border-glass)", 
                  paddingTop: "1.25rem", 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: "1rem" 
                }}
              >
                <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-muted)", margin: 0, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <Plus size={16} />
                  <span>Agregar Evento Importante</span>
                </h4>

                {formError && <div className="badge-error" style={{ padding: "0.5rem 0.75rem", fontSize: "0.8rem", borderRadius: "4px" }}>{formError}</div>}
                {formSuccess && <div className="badge-success" style={{ padding: "0.5rem 0.75rem", fontSize: "0.8rem", borderRadius: "4px", backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.3)" }}>{formSuccess}</div>}

                <form onSubmit={handleCreateEvent} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="evt_title">Título del Evento *</label>
                    <input
                      id="evt_title"
                      type="text"
                      className="form-control"
                      placeholder="Ej: Feria de ciencias / Reunión de Padres"
                      value={newEventTitle}
                      onChange={(e) => setNewEventTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" htmlFor="evt_tipo">Categoría</label>
                      <select
                        id="evt_tipo"
                        className="form-control"
                        value={newEventTipo}
                        onChange={(e) => setNewEventTipo(e.target.value)}
                      >
                        <option value={TIPOS.PERSONALIZADO}>Personalizado / Importante</option>
                        <option value={TIPOS.INSTITUCIONAL}>Institucional</option>
                        <option value={TIPOS.EFEMERIDE}>Efeméride</option>
                        <option value={TIPOS.RECESO}>Receso / Vacaciones</option>
                        <option value={TIPOS.EXAMEN}>Exámenes</option>
                        <option value={TIPOS.FORMACION}>Formación Docente</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" htmlFor="evt_end_date">Fecha Fin (Opcional)</label>
                      <input
                        id="evt_end_date"
                        type="date"
                        className="form-control"
                        value={newEventEndDate}
                        onChange={(e) => setNewEventEndDate(e.target.value)}
                        min={selectedCell.dateStr}
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    style={{ width: "100%", marginTop: "0.25rem", padding: "0.55rem" }}
                  >
                    <span>Guardar Evento en Calendario</span>
                  </button>
                </form>
              </div>
            )}

            {!isAdmin && (
              <div 
                style={{ 
                  borderTop: "1px solid var(--border-glass)", 
                  paddingTop: "1rem", 
                  fontSize: "0.75rem", 
                  color: "var(--text-inactive)", 
                  textAlign: "center",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.25rem"
                }}
              >
                <Sparkles size={12} style={{ color: "var(--color-ocre)" }} />
                <span>Iniciá sesión como administrador para agregar eventos importantes en esta fecha.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Attribution footer */}
      <div style={{
        padding: "0.5rem",
        fontSize: "0.72rem",
        color: "var(--text-inactive)",
        textAlign: "center",
        fontStyle: "italic"
      }}>
        Fuente Oficial: Calendario Escolar 2026 — Resolución Ministerial Nro. 297/2025 — Ministerio de Educación de la Provincia de Córdoba.
      </div>
    </div>
  );
}
