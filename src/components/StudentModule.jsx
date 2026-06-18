// src/components/StudentModule.jsx
import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Download, 
  Edit, 
  Trash2, 
  Eye, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  FolderOpen,
  Calendar,
  AlertCircle
} from "lucide-react";
import { getStudents, saveStudent, deleteStudent } from "../firebase";
import { useDialog } from "../context/DialogContext";
import * as XLSX from "xlsx";

export default function StudentModule({ user }) {
  const isAdmin = user.role === "admin";
  const { confirm, alert } = useDialog();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("activos"); // "activos" | "inactivos"
  
  // Filters state
  const [filters, setFilters] = useState({
    search: "",
    ano_actual: "",
    estado: "Activo", // default active
    turno: "",
    tiene_previas: "",
    documentacion_completa: "",
    falta_pase_definitivo: "",
    ano_ingreso: "",
    en_gestion: ""
  });

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  // Form state
  const [formValues, setFormValues] = useState(getEmptyStudentForm());
  const [formErrors, setFormErrors] = useState({});
  const [newPrevia, setNewPrevia] = useState({
    nombre_materia: "",
    ano_materia: "1°",
    tipo: "Previa",
    estado: "Pendiente",
    observaciones: ""
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getStudents(filters);
      setStudents(data);
    } catch (e) {
      console.error("Error loading students:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  function getEmptyStudentForm() {
    return {
      dni: "",
      apellido: "",
      nombre: "",
      fecha_nacimiento: "",
      telefono: "",
      domicilio: "",
      correo: "",
      fecha_ingreso: new Date().toISOString().split("T")[0],
      ano_ingreso: "1°",
      ano_actual: "1°",
      turno: "Noche",
      estado: "Activo",
      en_gestion: false,
      bibliorato: "",
      ano_apertura_legajo: new Date().getFullYear(),
      documentos: {
        dni: "Pendiente",
        cus: "Pendiente",
        certificado_primaria: "Pendiente",
        pase_provisorio: "No aplica",
        pase_definitivo: "No aplica"
      },
      previas: []
    };
  }

  // Handle entry year change to lock documents automatically
  const handleFormEntryYearChange = (val) => {
    setFormValues(prev => {
      const docs = { ...prev.documentos };
      if (val === "1°") {
        docs.certificado_primaria = "Pendiente";
        docs.pase_provisorio = "No aplica";
        docs.pase_definitivo = "No aplica";
      } else {
        // Allow either Certificado Primaria or Pase Definitivo/Provisorio
        docs.certificado_primaria = "Pendiente";
        docs.pase_provisorio = "Pendiente";
        docs.pase_definitivo = "Pendiente";
      }
      return {
        ...prev,
        ano_ingreso: val,
        documentos: docs
      };
    });
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? "true" : "") : value
    }));
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setFilters(prev => ({
      ...prev,
      estado: tab === "activos" ? "Activo" : "Inactivos"
    }));
  };

  // Open Add Student
  const handleOpenAdd = () => {
    setFormValues(getEmptyStudentForm());
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  // Open Edit Student
  const handleOpenEdit = (student) => {
    setFormValues(JSON.parse(JSON.stringify(student))); // deep copy
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  // Open Detail
  const handleOpenDetail = (student) => {
    setSelectedStudent(student);
    setIsDetailModalOpen(true);
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!formValues.dni || !/^\d{8}$/.test(formValues.dni.toString())) {
      errors.dni = "El DNI debe tener exactamente 8 dígitos numéricos.";
    }
    if (!formValues.apellido.trim()) {
      errors.apellido = "El apellido es obligatorio.";
    }
    if (!formValues.nombre.trim()) {
      errors.nombre = "El nombre es obligatorio.";
    }
    
    // Check DNI duplicates if it's a new student
    const isNew = !students.some(s => s.dni === formValues.dni);
    // If editing, we allow matching own DNI
    const isDuplicate = isNew && students.some(s => s.dni === formValues.dni);
    if (isDuplicate) {
      errors.dni = "Ya existe un estudiante o profesor registrado con este DNI.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save Student
  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    try {
      await saveStudent(formValues, user.email);
      setIsEditModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      await alert("Error al guardar el estudiante.", "Error de Guardado");
    }
  };

  // Delete Student
  const handleDelete = async (dni) => {
    const isConfirmed = await confirm(
      "¿Está seguro de que desea eliminar permanentemente este estudiante y su legajo?",
      "Confirmar Eliminación"
    );
    if (isConfirmed) {
      try {
        await deleteStudent(dni, "", user.email);
        loadData();
      } catch (err) {
        console.error(err);
        await alert("Error al eliminar.", "Error de Eliminación");
      }
    }
  };

  // Export to Excel
  const handleExport = () => {
    const dataToExport = students.map(s => {
      const row = {
        "Nombre Completo": `${s.apellido}, ${s.nombre}`,
        "Año Actual": s.ano_actual,
        "Turno": s.turno,
        "Estado": s.estado,
        "En Gestión": s.en_gestion ? "SÍ" : "NO",
        "Apto Titular": s.apto_titular ? "SI" : "NO",
        "Apertura Legajo": s.ano_apertura_legajo,
        "Bibliorato": s.bibliorato
      };
      
      // Admin gets sensitive fields exported too
      if (isAdmin) {
        row["DNI"] = s.dni;
        row["Fecha Nacimiento"] = s.fecha_nacimiento;
        row["Edad"] = s.edad;
        row["Celular"] = s.telefono;
        row["Correo Electrónico"] = s.correo;
        row["Año Ingreso"] = s.ano_ingreso;
        row["DNI Presentado"] = s.documentos?.dni || "Pendiente";
        row["CUS Presentado"] = s.documentos?.cus || "Pendiente";
        row["Cert. Primaria"] = s.documentos?.certificado_primaria || "N/A";
        row["Pase Provisorio"] = s.documentos?.pase_provisorio || "N/A";
        row["Pase Definitivo"] = s.documentos?.pase_definitivo || "N/A";
        row["Cant. Previas"] = s.previas?.length || 0;
      }
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Estudiantes Filtrados");

    // Generate sheet data as binary array
    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    
    // Create Blob with exact Excel OpenXML MIME type
    const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const filename = `SisGest_Estudiantes_${new Date().toISOString().split("T")[0]}.xlsx`;

    // Create temporary link and inject it into body to force download with filename
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 150);
  };

  // Add previa to current editing student
  const handleAddPrevia = async () => {
    if (!newPrevia.nombre_materia.trim()) {
      await alert("Ingrese el nombre de la materia.", "Materia Requerida");
      return;
    }
    const previa = {
      ...newPrevia,
      fecha_carga: new Date().toISOString().split("T")[0]
    };
    setFormValues(prev => ({
      ...prev,
      previas: [...prev.previas, previa]
    }));
    setNewPrevia({
      nombre_materia: "",
      ano_materia: "1°",
      tipo: "Previa",
      estado: "Pendiente",
      observaciones: ""
    });
  };

  // Delete previa from current editing student
  const handleDeletePrevia = (idx) => {
    setFormValues(prev => ({
      ...prev,
      previas: prev.previas.filter((_, i) => i !== idx)
    }));
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Module Title & Action Bar */}
      <div className="flex-between" style={{ flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", color: "#fff", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <FolderOpen size={28} style={{ color: "var(--primary)" }} />
            <span>Gestión de Estudiantes</span>
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Registros de legajos físicos, estado de documentación y materias previas.
          </p>
        </div>
        
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={handleExport} className="btn btn-secondary">
            <Download size={16} />
            <span>Exportar Excel</span>
          </button>
          
          {isAdmin && (
            <button onClick={handleOpenAdd} className="btn btn-primary">
              <Plus size={16} />
              <span>Nuevo Estudiante</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Selectors */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border-glass)", gap: "0.5rem" }}>
        <button
          onClick={() => handleTabChange("activos")}
          style={{
            padding: "0.75rem 1.5rem",
            background: activeTab === "activos" ? "rgba(99, 102, 241, 0.12)" : "transparent",
            color: activeTab === "activos" ? "#fff" : "var(--text-muted)",
            border: "none",
            borderBottom: activeTab === "activos" ? "2px solid var(--primary)" : "2px solid transparent",
            fontFamily: "var(--font-family-title)",
            fontSize: "1rem",
            fontWeight: activeTab === "activos" ? 600 : 500,
            cursor: "pointer",
            transition: "all var(--transition-fast)"
          }}
          id="tab-students-active"
        >
          Estudiantes Activos
        </button>
        <button
          onClick={() => handleTabChange("inactivos")}
          style={{
            padding: "0.75rem 1.5rem",
            background: activeTab === "inactivos" ? "rgba(99, 102, 241, 0.12)" : "transparent",
            color: activeTab === "inactivos" ? "#fff" : "var(--text-muted)",
            border: "none",
            borderBottom: activeTab === "inactivos" ? "2px solid var(--primary)" : "2px solid transparent",
            fontFamily: "var(--font-family-title)",
            fontSize: "1rem",
            fontWeight: activeTab === "inactivos" ? 600 : 500,
            cursor: "pointer",
            transition: "all var(--transition-fast)"
          }}
          id="tab-students-inactive"
        >
          Archivo / Inactivos (Bajas y Egresados)
        </button>
      </div>

      {/* Filter Glass Card Panel */}
      <div className="glass-card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end" }}>
          {/* Free Text Search */}
          <div className="form-group" style={{ flexGrow: 1, minWidth: "220px", marginBottom: 0 }}>
            <label className="form-label" htmlFor="search">Buscar Alumno</label>
            <div style={{ position: "relative" }}>
              <input 
                id="search"
                type="text" 
                name="search"
                className="form-control"
                placeholder="Buscar por Nombre, Apellido o DNI..."
                value={filters.search}
                onChange={handleFilterChange}
                style={{ paddingLeft: "2.5rem" }}
              />
              <Search size={16} style={{ position: "absolute", left: "0.9rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-inactive)" }} />
            </div>
          </div>

          <div className="form-group" style={{ width: "120px", marginBottom: 0 }}>
            <label className="form-label" htmlFor="ano_actual">Año Actual</label>
            <select id="ano_actual" name="ano_actual" className="form-control" value={filters.ano_actual} onChange={handleFilterChange}>
              <option value="">Todos</option>
              <option value="1°">1° Año</option>
              <option value="2°">2° Año</option>
              <option value="3°">3° Año</option>
            </select>
          </div>



          <div className="form-group" style={{ width: "120px", marginBottom: 0 }}>
            <label className="form-label" htmlFor="turno">Turno</label>
            <select id="turno" name="turno" className="form-control" value={filters.turno} onChange={handleFilterChange}>
              <option value="">Todos</option>
              <option value="Mañana">Mañana</option>
              <option value="Tarde">Tarde</option>
              <option value="Noche">Noche</option>
            </select>
          </div>

          {activeTab === "inactivos" && (
            <div className="form-group" style={{ width: "160px", marginBottom: 0 }}>
              <label className="form-label" htmlFor="estado">Estado Baja/Historial</label>
              <select id="estado" name="estado" className="form-control" value={filters.estado} onChange={handleFilterChange}>
                <option value="Inactivos">Todos los inactivos</option>
                <option value="Baja">Baja</option>
                <option value="Egresado">Egresado</option>
                <option value="Egresado con Previas">Con Previas Eg.</option>
              </select>
            </div>
          )}
        </div>

        {/* Advanced Filter Row */}
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1rem", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", cursor: "pointer", color: "var(--text-muted)" }} htmlFor="en_gestion_chk">
              <input 
                id="en_gestion_chk"
                type="checkbox" 
                name="en_gestion"
                checked={filters.en_gestion === "true"}
                onChange={handleFilterChange}
                style={{ accentColor: "var(--color-ocre)" }}
              />
              <span>En Gestión</span>
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", cursor: "pointer", color: "var(--text-muted)" }} htmlFor="tiene_previas_chk">
              <input 
                id="tiene_previas_chk"
                type="checkbox" 
                name="tiene_previas"
                checked={filters.tiene_previas === "true"}
                onChange={handleFilterChange}
                style={{ accentColor: "var(--primary)" }}
              />
              <span>Tiene Previas Pendientes</span>
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", cursor: "pointer", color: "var(--text-muted)" }} htmlFor="falta_pase_definitivo_chk">
              <input 
                id="falta_pase_definitivo_chk"
                type="checkbox" 
                name="falta_pase_definitivo"
                checked={filters.falta_pase_definitivo === "true"}
                onChange={handleFilterChange}
                style={{ accentColor: "var(--primary)" }}
              />
              <span>Falta Pase Definitivo</span>
            </label>
          </div>

          <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginLeft: "auto" }}>
            <div className="form-group" style={{ width: "180px", marginBottom: 0, flexDirection: "row", alignItems: "center", gap: "0.5rem" }}>
              <label className="form-label" style={{ whiteSpace: "nowrap" }} htmlFor="documentacion_completa">Documentación:</label>
              <select id="documentacion_completa" name="documentacion_completa" className="form-control" value={filters.documentacion_completa} onChange={handleFilterChange} style={{ padding: "0.45rem" }}>
                <option value="">Todas</option>
                <option value="Completa">Completa</option>
                <option value="Incompleta">Incompleta</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="glass-card" style={{ padding: "1rem" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>Cargando alumnos...</div>
        ) : students.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>No se encontraron alumnos con los filtros seleccionados.</div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  {isAdmin && <th>DNI</th>}
                  <th>Estudiante</th>
                  <th>Año Actual</th>
                  <th>Estado</th>
                  <th style={{ textAlign: "center" }}>Previas</th>
                  <th style={{ textAlign: "center" }}>Apto Titular</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const pendingPreviasCount = student.previas ? student.previas.filter(p => p.estado !== "Aprobada").length : 0;
                  return (
                    <tr key={student.dni}>
                      {isAdmin && <td style={{ fontFamily: "monospace" }}>{student.dni}</td>}
                      <td style={{ fontWeight: 600 }}>{student.apellido}, {student.nombre}</td>
                      <td>{student.ano_actual || "-"}</td>
                      <td>
                        <span 
                          className="badge" 
                          style={{
                            backgroundColor: 
                              student.estado === "Activo" ? "var(--color-success-bg)" : 
                              student.estado === "Baja" ? "var(--color-error-bg)" : 
                              "rgba(255,255,255,0.05)",
                            color: 
                              student.estado === "Activo" ? "var(--color-success)" : 
                              student.estado === "Baja" ? "var(--color-error)" : 
                              "var(--text-muted)"
                          }}
                        >
                          {student.estado}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {pendingPreviasCount > 0 ? (
                          <span className="badge badge-warning" style={{ fontSize: "0.7rem", borderRadius: "var(--radius-sm)" }}>
                            {pendingPreviasCount}
                          </span>
                        ) : (
                          <span style={{ color: "var(--text-inactive)", fontSize: "0.85rem" }}>0</span>
                        )}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {student.apto_titular ? (
                          <span className="badge badge-success" title="Pase Definitivo o Certificado Primaria Presentado">APTO</span>
                        ) : (
                          <span className="badge badge-error" title="Documento habilitante para titular pendiente">PENDIENTE</span>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                          <button 
                            onClick={() => handleOpenDetail(student)}
                            className="btn btn-secondary"
                            style={{ padding: "0.35rem 0.5rem" }}
                            title="Ver Legajo Físico"
                          >
                            <Eye size={14} />
                          </button>
                          
                          {isAdmin && (
                            <>
                              <button 
                                onClick={() => handleOpenEdit(student)}
                                className="btn btn-secondary"
                                style={{ padding: "0.35rem 0.5rem" }}
                                title="Editar Datos"
                              >
                                <Edit size={14} />
                              </button>
                              <button 
                                onClick={() => handleDelete(student.dni)}
                                className="btn btn-danger"
                                style={{ padding: "0.35rem 0.5rem" }}
                                title="Eliminar Alumno"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =======================================================================
          DETAIL MODAL VIEW (Admin and Docente)
          ======================================================================= */}
      {isDetailModalOpen && selectedStudent && (
        <div style={modalBackdropStyle}>
          <div className="glass-card animate-fade-in" style={modalContentStyle(800)}>
            <div className="flex-between" style={{ borderBottom: "1px solid var(--border-glass)", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <FolderOpen size={24} style={{ color: "var(--primary)" }} />
                <div>
                  <h3 style={{ fontSize: "1.4rem", color: "#fff" }}>
                    Legajo Digital: {selectedStudent.apellido}, {selectedStudent.nombre}
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    Ciclo Lectivo Apertura: {selectedStudent.ano_apertura_legajo || "N/A"} | Bibliorato: {selectedStudent.bibliorato || "No asignado"}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} style={closeButtonStyle}>
                <X size={20} />
              </button>
            </div>

            {/* Ficha details */}
            <div className="grid-cols-2">
              {/* Personal Data */}
              <div className="glass-card" style={{ padding: "1.25rem", background: "rgba(0,0,0,0.2)" }}>
                <h4 style={{ color: "#fff", marginBottom: "0.75rem", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.25rem" }}>
                  Datos Personales
                </h4>
                <div style={detailGridStyle}>
                  {isAdmin && (
                    <>
                      <div><strong>DNI:</strong></div> <div style={{ fontFamily: "monospace" }}>{selectedStudent.dni}</div>
                      <div><strong>Edad:</strong></div> <div>{selectedStudent.edad ? `${selectedStudent.edad} años` : "N/A"} (F. Nac: {selectedStudent.fecha_nacimiento || "N/A"})</div>
                      <div><strong>Celular:</strong></div> <div>{selectedStudent.telefono || "N/A"}</div>
                      <div><strong>Correo:</strong></div> <div>{selectedStudent.correo || "N/A"}</div>
                      <div><strong>Domicilio:</strong></div> <div>{selectedStudent.domicilio || "N/A"}</div>
                    </>
                  )}
                  {!isAdmin && (
                    <div style={{ gridColumn: "span 2", color: "var(--text-inactive)", fontSize: "0.85rem", fontStyle: "italic" }}>
                      Datos sensibles de contacto protegidos (Solo visualización autorizada para Director).
                    </div>
                  )}
                </div>
              </div>

              {/* Academic & Doc state */}
              <div className="glass-card" style={{ padding: "1.25rem", background: "rgba(0,0,0,0.2)" }}>
                <h4 style={{ color: "#fff", marginBottom: "0.75rem", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.25rem" }}>
                  Datos Académicos e Ingreso
                </h4>
                <div style={detailGridStyle}>
                  <div><strong>Año Actual / Turno:</strong></div> <div>{selectedStudent.ano_actual || "-"} Año | {selectedStudent.turno}</div>
                  <div><strong>Estado Escolar:</strong></div> 
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                    <span className="badge" style={{ backgroundColor: selectedStudent.estado === "Activo" ? "var(--color-success-bg)" : "var(--color-error-bg)", color: selectedStudent.estado === "Activo" ? "var(--color-success)" : "var(--color-error)" }}>
                      {selectedStudent.estado}
                    </span>
                    {selectedStudent.en_gestion && (
                      <span className="badge" style={{ backgroundColor: "rgba(244, 180, 26, 0.15)", color: "var(--color-warning)", border: "1px solid rgba(244, 180, 26, 0.3)" }}>En Gestión</span>
                    )}
                  </div>
                  <div><strong>Año de Ingreso:</strong></div> <div>Ingresó en {selectedStudent.ano_ingreso} (F. Ingreso: {selectedStudent.fecha_ingreso || "N/A"})</div>
                </div>
              </div>
            </div>

            {/* Document Checklist Area */}
            <div className="glass-card" style={{ padding: "1.25rem", marginTop: "1.5rem", background: "rgba(0,0,0,0.2)" }}>
              <h4 style={{ color: "#fff", marginBottom: "1rem", display: "flex", justifyContent: "between", alignItems: "center" }} className="flex-between">
                <span>Estado de Documentación Obligatoria</span>
                {selectedStudent.apto_titular ? (
                  <span className="badge badge-success">APTO PARA TITULAR EN VERDE</span>
                ) : (
                  <span className="badge badge-error">INCOMPLETO PARA TITULAR</span>
                )}
              </h4>
              
              <div className="grid-cols-3" style={{ gap: "1rem" }}>
                {/* DNI */}
                <div style={docCheckStyle(selectedStudent.documentos?.dni)}>
                  <strong>Fotocopia DNI:</strong>
                  <span>{selectedStudent.documentos?.dni || "Pendiente"}</span>
                </div>
                {/* CUS */}
                <div style={docCheckStyle(selectedStudent.documentos?.cus)}>
                  <strong>Cert. Salud (CUS):</strong>
                  <span>{selectedStudent.documentos?.cus || "Pendiente"}</span>
                </div>
                {/* Certificado Primario */}
                <div style={docCheckStyle(selectedStudent.documentos?.certificado_primaria)}>
                  <strong>Certificado Primaria:</strong>
                  <span>{selectedStudent.documentos?.certificado_primaria || "Pendiente"}</span>
                </div>
                {/* Pase Provisorio */}
                <div style={docCheckStyle(selectedStudent.documentos?.pase_provisorio)}>
                  <strong>Pase Provisorio:</strong>
                  <span>{selectedStudent.documentos?.pase_provisorio || "Pendiente"}</span>
                </div>
                {/* Pase Definitivo */}
                <div style={docCheckStyle(selectedStudent.documentos?.pase_definitivo)}>
                  <strong>Pase Definitivo:</strong>
                  <span>{selectedStudent.documentos?.pase_definitivo || "Pendiente"}</span>
                </div>
              </div>
            </div>

            {/* Subjects Table Area */}
            <div className="glass-card" style={{ padding: "1.25rem", marginTop: "1.5rem", background: "rgba(0,0,0,0.2)" }}>
              <h4 style={{ color: "#fff", marginBottom: "0.75rem" }}>
                Materias Previas y Equivalencias
              </h4>
              
              {!selectedStudent.previas || selectedStudent.previas.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", fontStyle: "italic" }}>
                  Este estudiante no registra materias previas ni equivalencias cargadas.
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
                        <th>Fecha Carga</th>
                        <th>Observaciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStudent.previas.map((p, idx) => (
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
                          <td>{p.fecha_carga}</td>
                          <td>{p.observaciones || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
              <button onClick={() => setIsDetailModalOpen(false)} className="btn btn-secondary">
                Cerrar Legajo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          EDIT / ADD MODAL VIEW (Admin only)
          ======================================================================= */}
      {isEditModalOpen && (
        <div style={modalBackdropStyle}>
          <div className="glass-card animate-fade-in" style={modalContentStyle(850)}>
            <div className="flex-between" style={{ borderBottom: "1px solid var(--border-glass)", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.4rem", color: "#fff" }}>
                {formValues.dni ? "Editar Legajo de Estudiante" : "Registrar Nuevo Estudiante"}
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} style={closeButtonStyle}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Form Grid */}
              <div className="grid-cols-3">
                <div className="form-group">
                  <label className="form-label" htmlFor="form_dni">DNI (8 dígitos) *</label>
                  <input 
                    id="form_dni"
                    type="text" 
                    className="form-control"
                    maxLength={8}
                    disabled={!!selectedStudent?.dni} // cannot edit DNI once created
                    value={formValues.dni}
                    onChange={(e) => setFormValues(prev => ({ ...prev, dni: e.target.value.replace(/\D/g, "") }))}
                  />
                  {formErrors.dni && <span style={errorLabelStyle}>{formErrors.dni}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="form_apellido">Apellidos *</label>
                  <input 
                    id="form_apellido"
                    type="text" 
                    className="form-control"
                    value={formValues.apellido}
                    onChange={(e) => setFormValues(prev => ({ ...prev, apellido: e.target.value }))}
                  />
                  {formErrors.apellido && <span style={errorLabelStyle}>{formErrors.apellido}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="form_nombre">Nombres *</label>
                  <input 
                    id="form_nombre"
                    type="text" 
                    className="form-control"
                    value={formValues.nombre}
                    onChange={(e) => setFormValues(prev => ({ ...prev, nombre: e.target.value }))}
                  />
                  {formErrors.nombre && <span style={errorLabelStyle}>{formErrors.nombre}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="form_dob">Fecha de Nacimiento</label>
                  <input 
                    id="form_dob"
                    type="date" 
                    className="form-control"
                    value={formValues.fecha_nacimiento}
                    onChange={(e) => setFormValues(prev => ({ ...prev, fecha_nacimiento: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="form_tel">Teléfono</label>
                  <input 
                    id="form_tel"
                    type="text" 
                    className="form-control"
                    value={formValues.telefono}
                    onChange={(e) => setFormValues(prev => ({ ...prev, telefono: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="form_correo">Correo Electrónico</label>
                  <input 
                    id="form_correo"
                    type="email" 
                    className="form-control"
                    placeholder="alumno@ejemplo.com"
                    value={formValues.correo}
                    onChange={(e) => setFormValues(prev => ({ ...prev, correo: e.target.value }))}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: "span 2" }}>
                  <label className="form-label" htmlFor="form_domicilio">Domicilio Completo</label>
                  <input 
                    id="form_domicilio"
                    type="text" 
                    className="form-control"
                    value={formValues.domicilio}
                    onChange={(e) => setFormValues(prev => ({ ...prev, domicilio: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="form_es">Última Escuela Secundaria / Primaria</label>
                  <input 
                    id="form_es"
                    type="text" 
                    className="form-control"
                    value={formValues.ultima_escuela}
                    onChange={(e) => setFormValues(prev => ({ ...prev, ultima_escuela: e.target.value }))}
                  />
                </div>



                <div className="form-group">
                  <label className="form-label" htmlFor="form_ano_ingreso">Año de Ingreso *</label>
                  <select 
                    id="form_ano_ingreso"
                    className="form-control"
                    value={formValues.ano_ingreso}
                    onChange={(e) => handleFormEntryYearChange(e.target.value)}
                  >
                    <option value="1°">1° Año</option>
                    <option value="2°">2° Año</option>
                    <option value="3°">3° Año</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="form_ano_actual">Año Cursado Actual *</label>
                  <select 
                    id="form_ano_actual"
                    className="form-control"
                    value={formValues.ano_actual}
                    onChange={(e) => setFormValues(prev => ({ ...prev, ano_actual: e.target.value }))}
                  >
                    <option value="1°">1° Año</option>
                    <option value="2°">2° Año</option>
                    <option value="3°">3° Año</option>
                  </select>
                </div>



                <div className="form-group">
                  <label className="form-label" htmlFor="form_turno">Turno *</label>
                  <select 
                    id="form_turno"
                    className="form-control"
                    value={formValues.turno}
                    onChange={(e) => setFormValues(prev => ({ ...prev, turno: e.target.value }))}
                  >
                    <option value="Mañana">Mañana</option>
                    <option value="Tarde">Tarde</option>
                    <option value="Noche">Noche</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="form_estado">Estado Escolar *</label>
                  <select 
                    id="form_estado"
                    className="form-control"
                    value={formValues.estado}
                    onChange={(e) => setFormValues(prev => ({ ...prev, estado: e.target.value }))}
                  >
                    <option value="Activo">Activo</option>
                    <option value="Egresado">Egresado</option>
                    <option value="Egresado con Previas">Con Previas Eg.</option>
                    <option value="Baja">Baja</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="form_en_gestion" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    En Gestión
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.9rem", color: "var(--text-main)", padding: "0.65rem 0" }}>
                    <input
                      id="form_en_gestion"
                      type="checkbox"
                      checked={!!formValues.en_gestion}
                      onChange={(e) => setFormValues(prev => ({ ...prev, en_gestion: e.target.checked }))}
                      style={{ accentColor: "var(--color-ocre)", width: "18px", height: "18px" }}
                    />
                    <span>{formValues.en_gestion ? "Sí — En proceso de gestión" : "No"}</span>
                  </label>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="form_biblio">Bibliorato Físico</label>
                  <input 
                    id="form_biblio"
                    type="text" 
                    className="form-control"
                    placeholder="Ej. B-03"
                    value={formValues.bibliorato}
                    onChange={(e) => setFormValues(prev => ({ ...prev, bibliorato: e.target.value }))}
                  />
                </div>
              </div>

              {/* Documents Status Form Section */}
              <div className="glass-card" style={{ padding: "1.25rem", background: "rgba(0,0,0,0.2)" }}>
                <h4 style={{ color: "#fff", marginBottom: "1rem" }}>Control de Documentación Física</h4>
                <div className="grid-cols-3">
                  <div className="form-group">
                    <label className="form-label" htmlFor="form_doc_dni">Fotocopia de DNI</label>
                    <select 
                      id="form_doc_dni"
                      className="form-control"
                      value={formValues.documentos.dni}
                      onChange={(e) => setFormValues(prev => ({ 
                        ...prev, 
                        documentos: { ...prev.documentos, dni: e.target.value } 
                      }))}
                    >
                      <option value="Presentado">Presentado</option>
                      <option value="Pendiente">Pendiente</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="form_doc_cus">Certificado de Salud CUS</label>
                    <select 
                      id="form_doc_cus"
                      className="form-control"
                      value={formValues.documentos.cus}
                      onChange={(e) => setFormValues(prev => ({ 
                        ...prev, 
                        documentos: { ...prev.documentos, cus: e.target.value } 
                      }))}
                    >
                      <option value="Presentado">Presentado</option>
                      <option value="Pendiente">Pendiente</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="form_doc_cp">Certificado Primario</label>
                    <select 
                      id="form_doc_cp"
                      className="form-control"
                      value={formValues.documentos.certificado_primaria || "Pendiente"}
                      onChange={(e) => setFormValues(prev => ({ 
                        ...prev, 
                        documentos: { ...prev.documentos, certificado_primaria: e.target.value } 
                      }))}
                    >
                      <option value="Presentado">Presentado</option>
                      <option value="Pendiente">Pendiente</option>
                      <option value="No aplica">No aplica</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="form_doc_pp">Pase Provisorio</label>
                    <select 
                      id="form_doc_pp"
                      className="form-control"
                      value={formValues.documentos.pase_provisorio || "Pendiente"}
                      onChange={(e) => setFormValues(prev => ({ 
                        ...prev, 
                        documentos: { ...prev.documentos, pase_provisorio: e.target.value } 
                      }))}
                    >
                      <option value="Presentado">Presentado</option>
                      <option value="Pendiente">Pendiente</option>
                      <option value="Reemplazado">Reemplazado</option>
                      <option value="No aplica">No aplica</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="form_doc_pd">Pase Definitivo</label>
                    <select 
                      id="form_doc_pd"
                      className="form-control"
                      value={formValues.documentos.pase_definitivo || "Pendiente"}
                      onChange={(e) => setFormValues(prev => ({ 
                        ...prev, 
                        documentos: { ...prev.documentos, pase_definitivo: e.target.value } 
                      }))}
                    >
                      <option value="Presentado">Presentado</option>
                      <option value="Pendiente">Pendiente</option>
                      <option value="No aplica">No aplica</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Previas Management Section */}
              <div className="glass-card" style={{ padding: "1.25rem", background: "rgba(0,0,0,0.2)" }}>
                <h4 style={{ color: "#fff", marginBottom: "1rem" }}>Cargar Materias Previas o Equivalencias</h4>
                
                {/* Form to add a previa */}
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem", alignItems: "flex-end" }}>
                  <div className="form-group" style={{ flexGrow: 1, minWidth: "180px", marginBottom: 0 }}>
                    <label className="form-label" htmlFor="new_materia">Materia</label>
                    <input 
                      id="new_materia"
                      type="text" 
                      className="form-control" 
                      placeholder="Ej. Matemática"
                      value={newPrevia.nombre_materia}
                      onChange={(e) => setNewPrevia(prev => ({ ...prev, nombre_materia: e.target.value }))}
                    />
                  </div>

                  <div className="form-group" style={{ width: "100px", marginBottom: 0 }}>
                    <label className="form-label" htmlFor="new_ano">Año</label>
                    <select id="new_ano" className="form-control" value={newPrevia.ano_materia} onChange={(e) => setNewPrevia(prev => ({ ...prev, ano_materia: e.target.value }))}>
                      <option value="1°">1° Año</option>
                      <option value="2°">2° Año</option>
                      <option value="3°">3° Año</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ width: "140px", marginBottom: 0 }}>
                    <label className="form-label" htmlFor="new_tipo">Tipo</label>
                    <select id="new_tipo" className="form-control" value={newPrevia.tipo} onChange={(e) => setNewPrevia(prev => ({ ...prev, tipo: e.target.value }))}>
                      <option value="Previa">Previa</option>
                      <option value="Equivalencia">Equivalencia</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ width: "130px", marginBottom: 0 }}>
                    <label className="form-label" htmlFor="new_estado">Estado</label>
                    <select id="new_estado" className="form-control" value={newPrevia.estado} onChange={(e) => setNewPrevia(prev => ({ ...prev, estado: e.target.value }))}>
                      <option value="Pendiente">Pendiente</option>
                      <option value="En proceso">En proceso</option>
                      <option value="Aprobada">Aprobada</option>
                    </select>
                  </div>

                  <button type="button" onClick={handleAddPrevia} className="btn btn-secondary">
                    Agregar
                  </button>
                </div>

                {/* Table of current student previas */}
                {formValues.previas.length > 0 && (
                  <div className="table-container">
                    <table className="custom-table" style={{ fontSize: "0.85rem" }}>
                      <thead>
                        <tr>
                          <th>Materia</th>
                          <th>Año</th>
                          <th>Tipo</th>
                          <th>Estado</th>
                          <th style={{ textAlign: "right" }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formValues.previas.map((p, idx) => (
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
                            <td style={{ textAlign: "right" }}>
                              <button 
                                type="button" 
                                onClick={() => handleDeletePrevia(idx)} 
                                className="btn btn-danger"
                                style={{ padding: "0.25rem 0.4rem" }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Form buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <span>Guardar Legajo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Styling definitions for modals
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

const detailGridStyle = {
  display: "grid",
  gridTemplateColumns: "130px 1fr",
  gap: "0.75rem 0.5rem",
  fontSize: "0.9rem"
};

const docCheckStyle = (status) => {
  const isPresented = status === "Presentado" || status === "Reemplazado";
  const isNa = status === "No aplica";
  return {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    padding: "0.75rem 1rem",
    borderRadius: "var(--radius-sm)",
    border: "1px solid",
    backgroundColor: isPresented ? "var(--color-success-bg)" : isNa ? "rgba(255,255,255,0.02)" : "var(--color-error-bg)",
    borderColor: isPresented ? "rgba(16, 185, 129, 0.2)" : isNa ? "rgba(255,255,255,0.05)" : "rgba(239, 68, 68, 0.2)",
    color: isPresented ? "var(--color-success)" : isNa ? "var(--text-muted)" : "var(--color-error)",
    fontSize: "0.85rem"
  };
};

const errorLabelStyle = {
  color: "var(--color-error)",
  fontSize: "0.75rem",
  marginTop: "0.25rem"
};
