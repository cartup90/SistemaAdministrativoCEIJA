// src/components/TodoModule.jsx
import React, { useState, useEffect } from "react";
import { 
  CheckCircle2, 
  Trash2, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  AlertTriangle, 
  Check, 
  Clock, 
  Sparkles, 
  Inbox, 
  CheckSquare, 
  ListTodo 
} from "lucide-react";
import { getAdminTasks, saveAdminTask, deleteAdminTask } from "../firebase";

const PRIORITIES = {
  ALTA: "Alta",
  MEDIA: "Media",
  BAJA: "Baja"
};

const PRIORITY_COLORS = {
  [PRIORITIES.ALTA]: { bg: "rgba(239, 68, 68, 0.12)", color: "#ef4444", border: "rgba(239, 68, 68, 0.25)" },
  [PRIORITIES.MEDIA]: { bg: "rgba(245, 158, 11, 0.12)", color: "#f59e0b", border: "rgba(245, 158, 11, 0.25)" },
  [PRIORITIES.BAJA]: { bg: "rgba(59, 130, 246, 0.12)", color: "#3b82f6", border: "rgba(59, 130, 246, 0.25)" }
};

export default function TodoModule({ user }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, pending, completed
  const [priorityFilter, setPriorityFilter] = useState("all"); // all, alta, media, baja

  // Form State
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState(PRIORITIES.MEDIA);
  const [taskDueDate, setTaskDueDate] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Confirmation States
  const [deleteConfirmTaskId, setDeleteConfirmTaskId] = useState(null);
  const [clearCompletedConfirm, setClearCompletedConfirm] = useState(false);

  const usuarioEmail = user?.email || "admin@ceija.edu.ar";

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await getAdminTasks();
      setTasks(data || []);
    } catch (e) {
      console.error("Error loading tasks:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleAddTask = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!taskTitle.trim()) {
      setFormError("La descripción de la tarea es obligatoria.");
      return;
    }

    const newTask = {
      titulo: taskTitle.trim(),
      prioridad: taskPriority,
      completada: false,
      fecha_limite: taskDueDate || null
    };

    try {
      await saveAdminTask(newTask, usuarioEmail);
      setTaskTitle("");
      setTaskDueDate("");
      setFormSuccess("Tarea agregada correctamente.");
      
      // Reload tasks list
      await loadTasks();
      
      // Clear success message after 3 seconds
      setTimeout(() => setFormSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      setFormError("Hubo un error al guardar la tarea.");
    }
  };

  const handleToggleTask = async (task) => {
    const updatedTask = {
      ...task,
      completada: !task.completada
    };
    try {
      // Optimistic UI update
      setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
      await saveAdminTask(updatedTask, usuarioEmail);
    } catch (err) {
      console.error("Error updating task status:", err);
      // Revert on failure
      loadTasks();
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      // Optimistic UI update
      setTasks(prev => prev.filter(t => t.id !== taskId));
      setDeleteConfirmTaskId(null);
      await deleteAdminTask(taskId, usuarioEmail);
    } catch (err) {
      console.error("Error deleting task:", err);
      // Revert on failure
      loadTasks();
    }
  };

  const handleClearCompleted = async () => {
    const completedTasks = tasks.filter(t => t.completada);
    if (completedTasks.length === 0) return;

    try {
      setLoading(true);
      setClearCompletedConfirm(false);
      for (const t of completedTasks) {
        await deleteAdminTask(t.id, usuarioEmail);
      }
      await loadTasks();
    } catch (e) {
      console.error("Error clearing completed tasks:", e);
      loadTasks();
    }
  };

  // Filter tasks based on search and filters
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.titulo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "completed" && task.completada) || 
      (statusFilter === "pending" && !task.completada);
    const matchesPriority = priorityFilter === "all" || task.prioridad === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Sort: pending tasks first, then sorted by created date descending
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.completada !== b.completada) {
      return a.completada ? 1 : -1;
    }
    return new Date(b.fecha_creacion) - new Date(a.fecha_creacion);
  });

  // Calculation of stats
  const totalTasks = tasks.length;
  const completedTasksCount = tasks.filter(t => t.completada).length;
  const pendingTasksCount = totalTasks - completedTasksCount;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Styles local setup */}
      <style dangerouslySetInnerHTML={{__html: `
        .todo-grid {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 1.5rem;
        }
        .todo-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.9rem 1.25rem;
          border-radius: var(--radius-sm);
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-glass);
          transition: all var(--transition-fast) ease;
        }
        .todo-item:hover {
          background: rgba(255, 255, 255, 0.04);
          transform: translateY(-1px);
        }
        .todo-item.completed {
          opacity: 0.6;
        }
        .todo-item-title {
          font-size: 0.95rem;
          font-weight: 500;
          color: var(--text-main);
          transition: color 0.2s ease;
        }
        .todo-item.completed .todo-item-title {
          text-decoration: line-through;
          color: var(--text-inactive);
        }
        .todo-checkbox {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          border: 2px solid var(--border-glass);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          background: transparent;
        }
        .todo-checkbox.checked {
          background: var(--color-success);
          border-color: var(--color-success);
        }
        .todo-progress-bar {
          height: 6px;
          border-radius: 3px;
          background: var(--border-glass);
          overflow: hidden;
          width: 100%;
          margin-top: 0.5rem;
        }
        .todo-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--color-ocre), var(--color-success));
          transition: width 0.3s ease;
        }
        @media (max-width: 900px) {
          .todo-grid {
            grid-template-columns: 1fr;
          }
        }
      `}} />

      {/* Header */}
      <div className="flex-between" style={{ flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ListTodo size={28} style={{ color: "var(--color-ladrillo)" }} />
            <span>Lista de Tareas</span>
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Gestioná y organizá los pendientes administrativos del anexo.
          </p>
        </div>
      </div>

      {/* Stats Widget */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        <div className="glass-card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ padding: "0.75rem", borderRadius: "var(--radius-sm)", background: "rgba(99, 102, 241, 0.08)", color: "var(--color-primary)" }}>
            <CheckSquare size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-main)", margin: 0 }}>{totalTasks}</h3>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>Total Tareas</span>
          </div>
        </div>

        <div className="glass-card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ padding: "0.75rem", borderRadius: "var(--radius-sm)", background: "rgba(245, 158, 11, 0.08)", color: "var(--color-warning)" }}>
            <Clock size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-main)", margin: 0 }}>{pendingTasksCount}</h3>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>Pendientes</span>
          </div>
        </div>

        <div className="glass-card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.25rem", justifyContent: "center" }}>
          <div className="flex-between" style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)" }}>
            <span>Tareas Completadas</span>
            <span style={{ color: "var(--color-success)" }}>{completedTasksCount} ({completionPercentage}%)</span>
          </div>
          <div className="todo-progress-bar">
            <div className="todo-progress-fill" style={{ width: `${completionPercentage}%` }} />
          </div>
        </div>
      </div>

      {/* Main Grid: Form + List */}
      <div className="todo-grid">
        {/* Left Side: Create Task Card */}
        <div className="glass-card" style={{ padding: "1.5rem", height: "fit-content", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.3rem", margin: 0 }}>
            <Plus size={18} style={{ color: "var(--color-ladrillo)" }} />
            <span>Nueva Tarea</span>
          </h3>

          {formError && <div className="badge-error" style={{ padding: "0.5rem 0.75rem", fontSize: "0.8rem", borderRadius: "4px" }}>{formError}</div>}
          {formSuccess && <div className="badge-success" style={{ padding: "0.5rem 0.75rem", fontSize: "0.8rem", borderRadius: "4px", backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.3)" }}>{formSuccess}</div>}

          <form onSubmit={handleAddTask} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="task_title">Descripción *</label>
              <textarea
                id="task_title"
                className="form-control"
                placeholder="Ej: Revisar legajos incompletos..."
                rows="3"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                style={{ resize: "none", fontSize: "0.9rem" }}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="task_priority">Prioridad</label>
              <select
                id="task_priority"
                className="form-control"
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value)}
                style={{ fontSize: "0.9rem" }}
              >
                <option value={PRIORITIES.ALTA}>🔴 Alta</option>
                <option value={PRIORITIES.MEDIA}>🟡 Media</option>
                <option value={PRIORITIES.BAJA}>🔵 Baja</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="task_due">Vencimiento (Opcional)</label>
              <input
                id="task_due"
                type="date"
                className="form-control"
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
                style={{ fontSize: "0.9rem" }}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ width: "100%", marginTop: "0.5rem", padding: "0.6rem" }}
            >
              <span>Agregar Tarea</span>
            </button>
          </form>
        </div>

        {/* Right Side: Tasks List */}
        <div className="glass-card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Filters Bar */}
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
            {/* Search Input */}
            <div style={{ position: "relative", flexGrow: 1, minWidth: "150px" }}>
              <input
                type="text"
                className="form-control"
                placeholder="Buscar tarea..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: "2.25rem", paddingRight: "1.5rem", fontSize: "0.85rem", height: "2.3rem", margin: 0 }}
              />
              <Search size={14} style={{ position: "absolute", left: "0.8rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-inactive)" }} />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  style={{ position: "absolute", right: "0.6rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-inactive)", cursor: "pointer" }}
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <Filter size={12} style={{ color: "var(--text-inactive)" }} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-control"
                style={{ fontSize: "0.85rem", height: "2.3rem", padding: "0 1.5rem 0 0.5rem", width: "125px", margin: 0 }}
              >
                <option value="all">Todos los estados</option>
                <option value="pending">Pendientes</option>
                <option value="completed">Completados</option>
              </select>
            </div>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="form-control"
              style={{ fontSize: "0.85rem", height: "2.3rem", padding: "0 1.5rem 0 0.5rem", width: "125px", margin: 0 }}
            >
              <option value="all">Todas las prioridades</option>
              {Object.values(PRIORITIES).map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            {/* Clear Completed Button */}
            {completedTasksCount > 0 && (
              <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
                {clearCompletedConfirm ? (
                  <>
                    <span style={{ fontSize: "0.78rem", color: "var(--color-ladrillo)", fontWeight: 600 }}>¿Borrar {completedTasksCount}?</span>
                    <button
                      onClick={handleClearCompleted}
                      className="btn btn-primary"
                      style={{ padding: "0.3rem 0.6rem", fontSize: "0.78rem", backgroundColor: "#ef4444", borderColor: "#ef4444" }}
                      id="confirm_clear_completed"
                    >
                      Sí
                    </button>
                    <button
                      onClick={() => setClearCompletedConfirm(false)}
                      className="btn btn-secondary"
                      style={{ padding: "0.3rem 0.6rem", fontSize: "0.78rem" }}
                    >
                      No
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setClearCompletedConfirm(true)}
                    className="btn btn-secondary"
                    style={{ padding: "0.45rem 0.75rem", fontSize: "0.8rem", borderColor: "rgba(239, 68, 68, 0.2)", color: "#ef4444" }}
                    id="clear_completed_btn"
                  >
                    Limpiar Completadas
                  </button>
                )}
              </div>
            )}
          </div>

          {/* List Wrapper */}
          {loading ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
              <span>Cargando tareas pendientes...</span>
            </div>
          ) : sortedTasks.length === 0 ? (
            <div style={{ padding: "4rem 2rem", textAlign: "center", border: "1px dashed var(--border-glass)", borderRadius: "var(--radius-sm)", color: "var(--text-inactive)", display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "center" }}>
              <Inbox size={32} style={{ opacity: 0.4 }} />
              <p style={{ fontWeight: 600, fontSize: "0.95rem", margin: 0 }}>No hay tareas registradas</p>
              <p style={{ fontSize: "0.8rem", margin: 0 }}>Probá cambiando los filtros o agregá una nueva tarea.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {sortedTasks.map((task) => {
                const colors = PRIORITY_COLORS[task.prioridad] || PRIORITY_COLORS[PRIORITIES.MEDIA];
                
                return (
                  <div 
                    key={task.id} 
                    className={`todo-item ${task.completada ? "completed" : ""}`}
                  >
                    <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", flexGrow: 1 }}>
                      {/* Checkbox */}
                      <button 
                        onClick={() => handleToggleTask(task)}
                        className={`todo-checkbox ${task.completada ? "checked" : ""}`}
                        style={{ marginTop: "0.15rem", flexShrink: 0 }}
                      >
                        {task.completada && <Check size={14} style={{ color: "#fff" }} />}
                      </button>

                      {/* Title & Info */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flexGrow: 1 }}>
                        <span className="todo-item-title">
                          {task.titulo}
                        </span>
                        
                        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
                          {/* Priority Badge */}
                          <span 
                            style={{ 
                              fontSize: "0.65rem", 
                              fontWeight: 700, 
                              textTransform: "uppercase", 
                              letterSpacing: "0.02em",
                              padding: "0.1rem 0.4rem", 
                              borderRadius: "3px", 
                              backgroundColor: colors.bg, 
                              color: colors.color, 
                              border: `1px solid ${colors.border}` 
                            }}
                          >
                            {task.prioridad}
                          </span>

                          {/* Created Date */}
                          <span style={{ fontSize: "0.7rem", color: "var(--text-inactive)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                            Creado: {new Date(task.fecha_creacion).toLocaleDateString("es-AR")}
                          </span>

                          {/* Due Date */}
                          {task.fecha_limite && (
                            <span style={{ fontSize: "0.7rem", color: task.completada ? "var(--text-inactive)" : "var(--color-ladrillo)", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.25rem" }}>
                              <Calendar size={10} />
                              Vence: {new Date(task.fecha_limite + "T00:00:00").toLocaleDateString("es-AR")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Delete Action */}
                    {deleteConfirmTaskId === task.id ? (
                      <div style={{ display: "flex", gap: "0.25rem", alignItems: "center", marginLeft: "1rem", flexShrink: 0 }}>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
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
                          id={`confirm_del_${task.id}`}
                        >
                          Borrar
                        </button>
                        <button
                          onClick={() => setDeleteConfirmTaskId(null)}
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
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmTaskId(task.id)}
                        style={{
                          background: "rgba(220, 38, 38, 0.08)",
                          border: "1px solid rgba(220, 38, 38, 0.15)",
                          color: "#ef4444",
                          padding: "0.35rem",
                          borderRadius: "4px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          marginLeft: "1rem",
                          flexShrink: 0
                        }}
                        title="Eliminar tarea"
                        id={`delete_btn_${task.id}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
