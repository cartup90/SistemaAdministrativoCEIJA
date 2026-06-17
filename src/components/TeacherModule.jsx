// src/components/TeacherModule.jsx
import React, { useState, useEffect } from "react";

import { 
  Plus as PlusIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Trash2 as TrashIcon,
  Eye as EyeIcon,
  X as XIcon,
  GraduationCap as GradIcon,
  Folder as FolderIcon
} from "lucide-react";
import { getTeachers, saveTeacher, deleteTeacher } from "../firebase";
import { useDialog } from "../context/DialogContext";

export default function TeacherModule({ user }) {
  const isAdmin = user.role === "admin";
  const { confirm, alert } = useDialog();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [filters, setFilters] = useState({
    search: "",
    materia: "",
    ano_dicta: "",
    designacion: "",
    estado: "", // Default empty (Todos)
    documentacion_incompleta: "",
    area: ""
  });

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  // Form state
  const [formValues, setFormValues] = useState(getEmptyTeacherForm());
  const [formErrors, setFormErrors] = useState({});

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getTeachers(filters);
      setTeachers(data);
    } catch (e) {
      console.error("Error loading teachers:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  function getEmptyTeacherForm() {
    return {
      dni: "",
      cuil: "",
      apellido: "",
      nombre: "",
      full_name: "",
      domicilio: "",
      telefono: "",
      correo: "",
      folio: "",
      designacion: "Titular",
      estado: "Activo",
      observaciones: "",
      fecha_baja: "",
      documentos: {
        titulo: "Pendiente",
        incompatibilidad: "Pendiente",
        servicios: "Pendiente",
        delitos_sexuales: "Pendiente"
      },
      materias: [],
      anos_dicta: [],
      area: ""
    };
  }

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? "true" : "") : value
    }));
  };

  const handleOpenAdd = () => {
    setFormValues(getEmptyTeacherForm());
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (teacher) => {
    setFormValues(JSON.parse(JSON.stringify(teacher)));
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const handleOpenDetail = (teacher) => {
    setSelectedTeacher(teacher);
    setIsDetailModalOpen(true);
  };

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

    const isNew = !teachers.some(t => t.dni === formValues.dni);
    const isDuplicate = isNew && teachers.some(t => t.dni === formValues.dni);
    if (isDuplicate) {
      errors.dni = "Ya existe un legajo registrado con este DNI.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Set full_name helper
    const updatedForm = {
      ...formValues,
      full_name: `${formValues.nombre} ${formValues.apellido}`.trim()
    };

    try {
      await saveTeacher(updatedForm, user.email);
      setIsEditModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      await alert("Error al guardar el docente.", "Error de Guardado");
    }
  };

  const handleDelete = async (dni) => {
    const isConfirmed = await confirm(
      "¿Está seguro de que desea eliminar permanentemente este profesor y su legajo?",
      "Confirmar Eliminación"
    );
    if (isConfirmed) {
      try {
        await deleteTeacher(dni, user.email);
        loadData();
      } catch (err) {
        console.error(err);
        await alert("Error al eliminar.", "Error de Eliminación");
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const parts = dateString.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateString;
  };

  // Check if documents are complete
  const isDocComplete = (teacher) => {
    if (!teacher.documentos) return false;
    return (
      teacher.documentos.titulo === "Presentado" &&
      teacher.documentos.incompatibilidad === "Presentado" &&
      teacher.documentos.servicios === "Presentado" &&
      teacher.documentos.delitos_sexuales === "Presentado"
    );
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Module Title */}
      <div className="flex-between" style={{ flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", color: "#fff", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <GradIcon size={28} style={{ color: "var(--primary)" }} />
            <span>Gestión de Profesores</span>
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Fichas docentes, control de folios y documentación anual obligatoria.
          </p>
        </div>
        
        {isAdmin && (
          <button onClick={handleOpenAdd} className="btn btn-primary">
            <PlusIcon size={16} />
            <span>Nuevo Profesor</span>
          </button>
        )}
      </div>

      {/* Filters Card */}
      <div className="glass-card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end" }}>
          {/* Search Box */}
          <div className="form-group" style={{ flexGrow: 1, minWidth: "220px", marginBottom: 0 }}>
            <label className="form-label" htmlFor="teach_search">Buscar Docente</label>
            <div style={{ position: "relative" }}>
              <input 
                id="teach_search"
                type="text" 
                name="search"
                className="form-control"
                placeholder="Buscar por Nombre, Apellido o DNI..."
                value={filters.search}
                onChange={handleFilterChange}
                style={{ paddingLeft: "2.5rem" }}
              />
              <SearchIcon size={16} style={{ position: "absolute", left: "0.9rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-inactive)" }} />
            </div>
          </div>

          <div className="form-group" style={{ width: "160px", marginBottom: 0 }}>
            <label className="form-label" htmlFor="teach_materia">Por Materia</label>
            <input 
              id="teach_materia"
              type="text" 
              name="materia"
              className="form-control"
              placeholder="Ej. Física"
              value={filters.materia}
              onChange={handleFilterChange}
            />
          </div>

          <div className="form-group" style={{ width: "120px", marginBottom: 0 }}>
            <label className="form-label" htmlFor="teach_ano">Por Año</label>
            <select id="teach_ano" name="ano_dicta" className="form-control" value={filters.ano_dicta} onChange={handleFilterChange}>
              <option value="">Todos</option>
              <option value="1°">1° Año</option>
              <option value="2°">2° Año</option>
              <option value="3°">3° Año</option>
            </select>
          </div>

          <div className="form-group" style={{ width: "130px", marginBottom: 0 }}>
            <label className="form-label" htmlFor="teach_desig">Designación</label>
            <select id="teach_desig" name="designacion" className="form-control" value={filters.designacion} onChange={handleFilterChange}>
              <option value="">Todas</option>
              <option value="Titular">Titular</option>
              <option value="Interino">Interino</option>
              <option value="Suplente">Suplente</option>
            </select>
          </div>

          <div className="form-group" style={{ width: "130px", marginBottom: 0 }}>
            <label className="form-label" htmlFor="teach_est">Estado</label>
            <select id="teach_est" name="estado" className="form-control" value={filters.estado} onChange={handleFilterChange}>
              <option value="">Todos</option>
              <option value="Activo">Activo</option>
              <option value="Licencia">Licencia</option>
              <option value="Baja">Baja</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>

          <div className="form-group" style={{ width: "160px", marginBottom: 0 }}>
            <label className="form-label" htmlFor="teach_area">Por Área Curricular</label>
            <select id="teach_area" name="area" className="form-control" value={filters.area} onChange={handleFilterChange}>
              <option value="">Todas</option>
              <option value="Naturales">Ciencias Naturales</option>
              <option value="Sociales">Ciencias Sociales</option>
              <option value="Lengua e Inglés">Lengua e Inglés</option>
              <option value="ATP">Área Técnico Profesional (ATP)</option>
              <option value="Coordinación">Coordinación</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
        </div>

        {/* Advanced Filter Row */}
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1rem", alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", cursor: "pointer", color: "var(--text-muted)" }} htmlFor="teach_doc_inc_chk">
            <input 
              id="teach_doc_inc_chk"
              type="checkbox" 
              name="documentacion_incompleta"
              checked={filters.documentacion_incompleta === "true"}
              onChange={handleFilterChange}
              style={{ accentColor: "var(--primary)" }}
            />
            <span>Documentación Anual Incompleta</span>
          </label>
        </div>
      </div>

      {/* Teachers Directory Table */}
      <div className="glass-card" style={{ padding: "1rem" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>Cargando docentes...</div>
        ) : teachers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>No se encontraron profesores.</div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>DNI</th>
                  <th>Docente</th>
                  <th>Teléfono</th>
                  <th>Designación</th>
                  <th>Estado</th>
                  <th>Materias dictadas</th>
                  <th style={{ textAlign: "center" }}>Doc. Anual</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => {
                  const docComplete = isDocComplete(teacher);
                  return (
                    <tr key={teacher.dni}>
                      <td style={{ fontFamily: "monospace" }}>{teacher.dni}</td>
                      <td style={{ fontWeight: 600 }}>
                        <div>{teacher.apellido}, {teacher.nombre}</div>
                        <div style={{ display: "flex", gap: "0.25rem", marginTop: "0.25rem", alignItems: "center", flexWrap: "wrap" }}>
                          {teacher.area && (
                            <span className="badge" style={{ backgroundColor: "rgba(99, 102, 241, 0.15)", color: "var(--primary)", fontSize: "0.65rem", padding: "0.1rem 0.35rem", textTransform: "none" }}>
                              {teacher.area}
                            </span>
                          )}
                          {teacher.anos_dicta && teacher.anos_dicta.length > 0 && (
                            <span className="badge" style={{ backgroundColor: "rgba(255, 255, 255, 0.08)", color: "var(--text-muted)", fontSize: "0.65rem", padding: "0.1rem 0.35rem", textTransform: "none" }}>
                              Años: {teacher.anos_dicta.join(", ")}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{teacher.telefono || "Sin registrar"}</td>
                      <td>
                        {teacher.designacion}
                        {teacher.designacion !== "Titular" && teacher.fecha_baja && (
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                            Baja: {formatDate(teacher.fecha_baja)}
                          </div>
                        )}
                      </td>
                      <td>
                        <span 
                          className="badge"
                          style={{
                            backgroundColor: 
                              teacher.estado === "Activo" ? "var(--color-success-bg)" : 
                              teacher.estado === "Licencia" ? "var(--color-warning-bg)" : 
                              "var(--color-error-bg)",
                            color: 
                              teacher.estado === "Activo" ? "var(--color-success)" : 
                              teacher.estado === "Licencia" ? "var(--color-warning)" : 
                              "var(--color-error)"
                          }}
                        >
                          {teacher.estado}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap", maxWidth: "250px" }}>
                          {teacher.materias && teacher.materias.length > 0 ? (
                            teacher.materias.map((m, idx) => (
                              <span key={idx} className="badge" style={{ backgroundColor: "rgba(255,255,255,0.03)", color: "var(--text-muted)", fontSize: "0.65rem", textTransform: "none" }}>
                                {m}
                              </span>
                            ))
                          ) : (
                            <span style={{ color: "var(--text-inactive)", fontSize: "0.8rem" }}>Sin materias asignadas</span>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {docComplete ? (
                          <span className="badge badge-success">COMPLETA</span>
                        ) : (
                          <span className="badge badge-warning">INCOMPLETA</span>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                          <button 
                            onClick={() => handleOpenDetail(teacher)}
                            className="btn btn-secondary"
                            style={{ padding: "0.35rem 0.5rem" }}
                            title="Ver Legajo Físico"
                          >
                            <EyeIcon size={14} />
                          </button>
                          
                          {isAdmin && (
                            <>
                              <button 
                                onClick={() => handleOpenEdit(teacher)}
                                className="btn btn-secondary"
                                style={{ padding: "0.35rem 0.5rem" }}
                                title="Editar Datos"
                              >
                                <EditIcon size={14} />
                              </button>
                              <button 
                                onClick={() => handleDelete(teacher.dni)}
                                className="btn btn-danger"
                                style={{ padding: "0.35rem 0.5rem" }}
                                title="Eliminar Docente"
                              >
                                <TrashIcon size={14} />
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
          DETAIL MODAL VIEW
          ======================================================================= */}
      {isDetailModalOpen && selectedTeacher && (
        <div style={modalBackdropStyle}>
          <div className="glass-card animate-fade-in" style={modalContentStyle(750)}>
            <div className="flex-between" style={{ borderBottom: "1px solid var(--border-glass)", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <FolderIcon size={24} style={{ color: "var(--primary)" }} />
                <div>
                  <h3 style={{ fontSize: "1.4rem", color: "#fff" }}>
                    Legajo Docente: {selectedTeacher.apellido}, {selectedTeacher.nombre}
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    Folio de Archivo: {selectedTeacher.folio || "Sin foliar"}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} style={closeButtonStyle}>
                <XIcon size={20} />
              </button>
            </div>

            <div className="grid-cols-2">
              {/* Personal Data */}
              <div className="glass-card" style={{ padding: "1.25rem", background: "rgba(0,0,0,0.2)" }}>
                <h4 style={{ color: "#fff", marginBottom: "0.75rem", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.25rem" }}>
                  Información Personal
                </h4>
                <div style={detailGridStyle}>
                  <div><strong>DNI / CUIL:</strong></div> <div style={{ fontFamily: "monospace" }}>{selectedTeacher.dni} {selectedTeacher.cuil ? `/ ${selectedTeacher.cuil}` : ""}</div>
                  <div><strong>Celular:</strong></div> <div>{selectedTeacher.telefono || "N/A"}</div>
                  <div><strong>Correo:</strong></div> <div>{selectedTeacher.correo || "N/A"}</div>
                  <div><strong>Domicilio:</strong></div> <div>{selectedTeacher.domicilio || "N/A"}</div>
                </div>
              </div>

              {/* Professional details */}
              <div className="glass-card" style={{ padding: "1.25rem", background: "rgba(0,0,0,0.2)" }}>
                <h4 style={{ color: "#fff", marginBottom: "0.75rem", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.25rem" }}>
                  Datos de Cargo
                </h4>
                <div style={detailGridStyle}>
                  <div><strong>Designación:</strong></div> <div>{selectedTeacher.designacion}</div>
                  {selectedTeacher.designacion !== "Titular" && selectedTeacher.fecha_baja && (
                    <>
                      <div><strong>Baja de Contrato:</strong></div> 
                      <div>{formatDate(selectedTeacher.fecha_baja)}</div>
                    </>
                  )}
                  <div><strong>Estado:</strong></div> <div>{selectedTeacher.estado}</div>
                  <div><strong>Área Curricular:</strong></div> <div>{selectedTeacher.area || "Sin asignar"}</div>
                  <div><strong>Años de dictado:</strong></div> <div>{selectedTeacher.anos_dicta && selectedTeacher.anos_dicta.length > 0 ? selectedTeacher.anos_dicta.join(", ") : "N/A"}</div>
                </div>
              </div>
            </div>

            {/* Document Checklist Area */}
            <div className="glass-card" style={{ padding: "1.25rem", marginTop: "1.5rem", background: "rgba(0,0,0,0.2)" }}>
              <h4 style={{ color: "#fff", marginBottom: "1rem" }}>Estado de Legajo de Documentos Anuales</h4>
              <div className="grid-cols-2" style={{ gap: "1rem" }}>
                <div style={docCheckStyle(selectedTeacher.documentos?.titulo)}>
                  <strong>Fotocopia de Título:</strong>
                  <span>{selectedTeacher.documentos?.titulo || "Pendiente"}</span>
                </div>
                <div style={docCheckStyle(selectedTeacher.documentos?.incompatibilidad)}>
                  <strong>Régimen de Incompatibilidad (DDJJ):</strong>
                  <span>{selectedTeacher.documentos?.incompatibilidad || "Pendiente"}</span>
                </div>
                <div style={docCheckStyle(selectedTeacher.documentos?.servicios)}>
                  <strong>Constancia de Servicios:</strong>
                  <span>{selectedTeacher.documentos?.servicios || "Pendiente"}</span>
                </div>
                <div style={docCheckStyle(selectedTeacher.documentos?.delitos_sexuales)}>
                  <strong>No adhesión a Delitos Sexuales (DDJJ):</strong>
                  <span>{selectedTeacher.documentos?.delitos_sexuales || "Pendiente"}</span>
                </div>
              </div>
            </div>

            {/* Materias asignadas */}
            <div className="glass-card" style={{ padding: "1.25rem", marginTop: "1.5rem", background: "rgba(0,0,0,0.2)" }}>
              <h4 style={{ color: "#fff", marginBottom: "0.75rem" }}>Materias Asignadas en Horarios Activos</h4>
              {selectedTeacher.materias && selectedTeacher.materias.length > 0 ? (
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {selectedTeacher.materias.map((m, idx) => (
                    <span key={idx} className="badge badge-success" style={{ fontSize: "0.8rem", textTransform: "none" }}>
                      {m}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", fontStyle: "italic" }}>
                  No se registran materias sincronizadas en la grilla semanal para este profesor.
                </p>
              )}
            </div>

            {selectedTeacher.observaciones && (
              <div className="glass-card" style={{ padding: "1.25rem", marginTop: "1.5rem", background: "rgba(0,0,0,0.2)" }}>
                <h4 style={{ color: "#fff", marginBottom: "0.5rem" }}>Observaciones</h4>
                <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>{selectedTeacher.observaciones}</p>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
              <button onClick={() => setIsDetailModalOpen(false)} className="btn btn-secondary">
                Cerrar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          EDIT / ADD MODAL VIEW
          ======================================================================= */}
      {isEditModalOpen && (
        <div style={modalBackdropStyle}>
          <div className="glass-card animate-fade-in" style={modalContentStyle(800)}>
            <div className="flex-between" style={{ borderBottom: "1px solid var(--border-glass)", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.4rem", color: "#fff" }}>
                {formValues.dni ? "Editar Ficha de Profesor" : "Registrar Nuevo Profesor"}
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} style={closeButtonStyle}>
                <XIcon size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Form grid inputs */}
              <div className="grid-cols-3">
                <div className="form-group">
                  <label className="form-label" htmlFor="tch_form_dni">DNI (Único) *</label>
                  <input 
                    id="tch_form_dni"
                    type="text" 
                    className="form-control"
                    maxLength={8}
                    disabled={!!selectedTeacher?.dni} // lock DNI once created
                    value={formValues.dni}
                    onChange={(e) => setFormValues(prev => ({ ...prev, dni: e.target.value.replace(/\D/g, "") }))}
                  />
                  {formErrors.dni && <span style={errorLabelStyle}>{formErrors.dni}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="tch_form_cuil">CUIL</label>
                  <input 
                    id="tch_form_cuil"
                    type="text" 
                    className="form-control"
                    placeholder="XX-XXXXXXXX-X"
                    value={formValues.cuil}
                    onChange={(e) => setFormValues(prev => ({ ...prev, cuil: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="tch_form_apellido">Apellidos *</label>
                  <input 
                    id="tch_form_apellido"
                    type="text" 
                    className="form-control"
                    value={formValues.apellido}
                    onChange={(e) => setFormValues(prev => ({ ...prev, apellido: e.target.value }))}
                  />
                  {formErrors.apellido && <span style={errorLabelStyle}>{formErrors.apellido}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="tch_form_nombre">Nombres *</label>
                  <input 
                    id="tch_form_nombre"
                    type="text" 
                    className="form-control"
                    value={formValues.nombre}
                    onChange={(e) => setFormValues(prev => ({ ...prev, nombre: e.target.value }))}
                  />
                  {formErrors.nombre && <span style={errorLabelStyle}>{formErrors.nombre}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="tch_form_tel">Teléfono Contacto</label>
                  <input 
                    id="tch_form_tel"
                    type="text" 
                    className="form-control"
                    value={formValues.telefono}
                    onChange={(e) => setFormValues(prev => ({ ...prev, telefono: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="tch_form_correo">Correo Electrónico</label>
                  <input 
                    id="tch_form_correo"
                    type="email" 
                    className="form-control"
                    placeholder="docente@ejemplo.com"
                    value={formValues.correo}
                    onChange={(e) => setFormValues(prev => ({ ...prev, correo: e.target.value }))}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: "span 2" }}>
                  <label className="form-label" htmlFor="tch_form_domicilio">Domicilio</label>
                  <input 
                    id="tch_form_domicilio"
                    type="text" 
                    className="form-control"
                    value={formValues.domicilio}
                    onChange={(e) => setFormValues(prev => ({ ...prev, domicilio: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="tch_form_folio">Folio Binder de Archivo</label>
                  <input 
                    id="tch_form_folio"
                    type="text" 
                    className="form-control"
                    placeholder="Ej. 9-16"
                    value={formValues.folio}
                    onChange={(e) => setFormValues(prev => ({ ...prev, folio: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="tch_form_desig">Designación *</label>
                  <select 
                    id="tch_form_desig"
                    className="form-control"
                    value={formValues.designacion}
                    onChange={(e) => setFormValues(prev => ({ ...prev, designacion: e.target.value }))}
                  >
                    <option value="Titular">Titular</option>
                    <option value="Interino">Interino</option>
                    <option value="Suplente">Suplente</option>
                  </select>
                </div>

                {formValues.designacion !== "Titular" && (
                  <div className="form-group">
                    <label className="form-label" htmlFor="tch_form_fbaja">Fecha de Baja de Contrato (MAB)</label>
                    <input 
                      id="tch_form_fbaja"
                      type="date"
                      className="form-control"
                      value={formValues.fecha_baja || ""}
                      onChange={(e) => setFormValues(prev => ({ ...prev, fecha_baja: e.target.value }))}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" htmlFor="tch_form_estado">Estado *</label>
                  <select 
                    id="tch_form_estado"
                    className="form-control"
                    value={formValues.estado}
                    onChange={(e) => setFormValues(prev => ({ ...prev, estado: e.target.value }))}
                  >
                    <option value="Activo">Activo</option>
                    <option value="Licencia">Licencia</option>
                    <option value="Baja">Baja</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="tch_form_area">Área Curricular *</label>
                  <select 
                    id="tch_form_area"
                    className="form-control"
                    value={formValues.area || ""}
                    onChange={(e) => setFormValues(prev => ({ ...prev, area: e.target.value }))}
                  >
                    <option value="">Sin asignar</option>
                    <option value="Naturales">Ciencias Naturales</option>
                    <option value="Sociales">Ciencias Sociales</option>
                    <option value="Lengua e Inglés">Lengua e Inglés</option>
                    <option value="ATP">Área Técnico Profesional (ATP)</option>
                    <option value="Coordinación">Coordinación</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Años de Dictado</label>
                  <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem", alignItems: "center" }}>
                    {["1°", "2°", "3°"].map(yr => {
                      const isChecked = formValues.anos_dicta && formValues.anos_dicta.includes(yr);
                      return (
                        <label key={yr} style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", cursor: "pointer", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                          <input 
                            type="checkbox"
                            value={yr}
                            checked={isChecked}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setFormValues(prev => {
                                const currentAnos = prev.anos_dicta || [];
                                const newAnos = checked 
                                  ? [...currentAnos, yr] 
                                  : currentAnos.filter(x => x !== yr);
                                newAnos.sort();
                                return { ...prev, anos_dicta: newAnos };
                              });
                            }}
                            style={{ accentColor: "var(--primary)" }}
                          />
                          <span>{yr}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="form-group" style={{ gridColumn: "span 3" }}>
                  <label className="form-label" htmlFor="tch_form_obs">Observaciones Generales</label>
                  <textarea 
                    id="tch_form_obs"
                    className="form-control"
                    rows={2}
                    value={formValues.observaciones}
                    onChange={(e) => setFormValues(prev => ({ ...prev, observaciones: e.target.value }))}
                    style={{ resize: "none" }}
                  />
                </div>
              </div>

              {/* Annual Documents Form Checklist */}
              <div className="glass-card" style={{ padding: "1.25rem", background: "rgba(0,0,0,0.2)" }}>
                <h4 style={{ color: "#fff", marginBottom: "1rem" }}>Legajo Anual: Estado de Documentos</h4>
                <div className="grid-cols-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="tch_doc_form_titulo">Fotocopia de Título</label>
                    <select 
                      id="tch_doc_form_titulo"
                      className="form-control"
                      value={formValues.documentos.titulo}
                      onChange={(e) => setFormValues(prev => ({ 
                        ...prev, 
                        documentos: { ...prev.documentos, titulo: e.target.value } 
                      }))}
                    >
                      <option value="Presentado">Presentado</option>
                      <option value="Pendiente">Pendiente</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="tch_doc_form_incompat">Régimen de Incompatibilidad (DDJJ)</label>
                    <select 
                      id="tch_doc_form_incompat"
                      className="form-control"
                      value={formValues.documentos.incompatibilidad}
                      onChange={(e) => setFormValues(prev => ({ 
                        ...prev, 
                        documentos: { ...prev.documentos, incompatibilidad: e.target.value } 
                      }))}
                    >
                      <option value="Presentado">Presentado</option>
                      <option value="Pendiente">Pendiente</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="tch_doc_form_serv">Constancia de Servicios</label>
                    <select 
                      id="tch_doc_form_serv"
                      className="form-control"
                      value={formValues.documentos.servicios}
                      onChange={(e) => setFormValues(prev => ({ 
                        ...prev, 
                        documentos: { ...prev.documentos, servicios: e.target.value } 
                      }))}
                    >
                      <option value="Presentado">Presentado</option>
                      <option value="Pendiente">Pendiente</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="tch_doc_form_delitos">No Adhesión a Delitos Sexuales (DDJJ)</label>
                    <select 
                      id="tch_doc_form_delitos"
                      className="form-control"
                      value={formValues.documentos.delitos_sexuales}
                      onChange={(e) => setFormValues(prev => ({ 
                        ...prev, 
                        documentos: { ...prev.documentos, delitos_sexuales: e.target.value } 
                      }))}
                    >
                      <option value="Presentado">Presentado</option>
                      <option value="Pendiente">Pendiente</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <span>Guardar Docente</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Styling definitions for modals (shared structure with StudentModule)
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
  const isPresented = status === "Presentado";
  return {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    padding: "0.75rem 1rem",
    borderRadius: "var(--radius-sm)",
    border: "1px solid",
    backgroundColor: isPresented ? "var(--color-success-bg)" : "var(--color-error-bg)",
    borderColor: isPresented ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
    color: isPresented ? "var(--color-success)" : "var(--color-error)",
    fontSize: "0.85rem"
  };
};

const errorLabelStyle = {
  color: "var(--color-error)",
  fontSize: "0.75rem",
  marginTop: "0.25rem"
};
