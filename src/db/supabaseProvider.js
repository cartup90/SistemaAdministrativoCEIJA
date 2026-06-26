// src/db/supabaseProvider.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 1. AUTHENTICATION SERVICES
export const login = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.toLowerCase().trim(),
    password: password
  });
  
  if (error) throw error;
  
  // Fetch user role
  const { data: roleData, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("email", email.toLowerCase().trim())
    .single();
    
  const role = roleData ? roleData.role : "comun";
  
  return {
    uid: data.user.id,
    email: data.user.email,
    role: role
  };
};

export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const onAuthChange = (callback) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (session) {
      const email = session.user.email;
      let role = "comun";
      try {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("email", email.toLowerCase().trim())
          .single();
        if (roleData) {
          role = roleData.role;
        }
      } catch (err) {
        console.error("Error fetching role from user_roles:", err);
      }
      callback({
        uid: session.user.id,
        email: email,
        role: role
      });
    } else {
      callback(null);
    }
  });
  
  return () => subscription.unsubscribe();
};

export const createUser = async (email, password, role, usuarioEmail) => {
  // 1. Register in Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email: email.toLowerCase().trim(),
    password: password
  });
  if (error) throw error;
  
  // 2. Set user role profile in public.user_roles
  const { error: roleError } = await supabase
    .from("user_roles")
    .upsert({ email: email.toLowerCase().trim(), role: role });
  if (roleError) throw roleError;
  
  // 3. Log auditoria
  await addAuditLog(usuarioEmail, "CREAR_USUARIO", "CONFIGURACION", `Se registró el usuario ${email} con rol ${role}`);
};

export const changePassword = async (currentPassword, newPassword) => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });
  if (error) throw error;
  
  // Log it
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await addAuditLog(user.email, "CONFIGURACION", "USUARIOS", "El usuario cambió su contraseña");
  }
};

// 2. AUDIT LOG SERVICES
export const addAuditLog = async (usuarioEmail, accion, modulo, descripcion) => {
  const logEntry = {
    usuario_email: usuarioEmail,
    accion: accion,
    modulo: modulo,
    descripcion: descripcion
  };
  try {
    await supabase.from("logs_auditoria").insert(logEntry);
  } catch (e) {
    console.error("Error writing audit log:", e);
  }
};

export const getAuditLogs = async () => {
  const { data, error } = await supabase
    .from("logs_auditoria")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(200);
    
  if (error) throw error;
  return data || [];
};

// 3. STUDENT SERVICES
export const getStudents = async (filters = {}) => {
  const { data, error } = await supabase
    .from("estudiantes")
    .select("*, materias_previas(*)");
    
  if (error) throw error;
  
  const mappedStudents = (data || []).map(st => {
    // Map documentos structure back to frontend expectations
    const documentos = {
      dni: st.dni_presentado || "Pendiente",
      cus: st.cus_presentado || "Pendiente",
      certificado_primaria: st.certificado_primaria || "Pendiente",
      pase_provisorio: st.pase_provisorio || "Pendiente",
      pase_definitivo: st.pase_definitivo || "Pendiente",
      equivalencias: st.equivalencias_presentado || "Pendiente"
    };
    
    // Map materias_previas to previas
    const previas = (st.materias_previas || []).map(p => ({
      nombre_materia: p.nombre_materia,
      ano_materia: p.ano_materia,
      tipo: p.tipo,
      estado: p.estado,
      fecha_carga: p.fecha_carga,
      observaciones: p.observaciones || ""
    }));
    
    // Calculate apto_titular
    const hasDni = documentos.dni === "Presentado";
    const hasCus = documentos.cus === "Presentado";
    const hasCertPrimaria = documentos.certificado_primaria === "Presentado";
    const hasPaseDefinitivo = documentos.pase_definitivo === "Presentado";
    const apto = hasDni && hasCus && (hasCertPrimaria || hasPaseDefinitivo);
    
    return {
      ...st,
      documentos,
      previas,
      apto_titular: apto
    };
  });
  
  return applyStudentFilters(mappedStudents, filters);
};

export const getStudentPublicInfo = async (dni) => {
  const { data: st, error } = await supabase
    .from("estudiantes")
    .select("*, materias_previas(*)")
    .eq("dni", dni.toString())
    .maybeSingle();
    
  if (error) throw error;
  if (st) {
    const documentos = {
      dni: st.dni_presentado || "Pendiente",
      cus: st.cus_presentado || "Pendiente",
      certificado_primaria: st.certificado_primaria || "Pendiente",
      pase_provisorio: st.pase_provisorio || "Pendiente",
      pase_definitivo: st.pase_definitivo || "Pendiente",
      equivalencias: st.equivalencias_presentado || "Pendiente"
    };
    
    const previas = (st.materias_previas || []).map(p => ({
      nombre_materia: p.nombre_materia,
      ano_materia: p.ano_materia,
      tipo: p.tipo,
      estado: p.estado,
      fecha_carga: p.fecha_carga,
      observaciones: p.observaciones || ""
    }));
    
    return {
      dni: st.dni,
      nombre: st.nombre,
      apellido: st.apellido,
      ano_actual: st.ano_actual,
      division: st.division,
      estado: st.estado,
      documentos,
      previas
    };
  }
  return null;
};

const applyStudentFilters = (students, filters) => {
  let result = [...students];

  if (filters.search) {
    const s = filters.search.toLowerCase();
    result = result.filter(st => 
      st.nombre.toLowerCase().includes(s) || 
      st.apellido.toLowerCase().includes(s) || 
      st.dni.toString().includes(s)
    );
  }
  if (filters.ano_actual) {
    result = result.filter(st => st.ano_actual === filters.ano_actual);
  }
  if (filters.estado) {
    if (filters.estado === "Inactivos") {
      result = result.filter(st => st.estado !== "Activo");
    } else {
      result = result.filter(st => st.estado === filters.estado);
    }
  }
  if (filters.ano_ingreso) {
    result = result.filter(st => st.ano_ingreso === filters.ano_ingreso);
  }
  if (filters.tiene_previas !== undefined && filters.tiene_previas !== "") {
    const has = filters.tiene_previas === "true" || filters.tiene_previas === true;
    result = result.filter(st => {
      const hasPrevias = st.previas && st.previas.some(p => p.estado !== "Aprobada");
      return has ? hasPrevias : !hasPrevias;
    });
  }
  if (filters.documentacion_completa) {
    result = result.filter(st => {
      if (!st.documentos) return false;
      const docs = Object.values(st.documentos);
      const requiredDocs = docs.filter(d => d !== "No aplica");
      const presentedDocs = requiredDocs.filter(d => d === "Presentado" || d === "Reemplazado");
      const isComplete = presentedDocs.length === requiredDocs.length;
      if (filters.documentacion_completa === "Completa") return isComplete;
      if (filters.documentacion_completa === "Incompleta") return !isComplete;
      return true;
    });
  }
  if (filters.falta_pase_definitivo === "true") {
    result = result.filter(st => 
      st.documentos && 
      st.documentos.pase_definitivo === "Pendiente" && 
      st.ano_ingreso !== "1°"
    );
  }
  if (filters.en_gestion === "true") {
    result = result.filter(st => st.en_gestion === true);
  }

  result.sort((a, b) => {
    const compA = `${a.apellido} ${a.nombre}`.toLowerCase();
    const compB = `${b.apellido} ${b.nombre}`.toLowerCase();
    return compA.localeCompare(compB);
  });

  return result;
};

export const saveStudent = async (student, usuarioEmail) => {
  // Compute Age
  if (student.fecha_nacimiento) {
    const dob = new Date(student.fecha_nacimiento);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    student.edad = age;
  } else {
    student.edad = null;
  }

  let apto = false;
  if (student.documentos) {
    const hasDni = student.documentos.dni === "Presentado";
    const hasCus = student.documentos.cus === "Presentado";
    const hasCertPrimaria = student.documentos.certificado_primaria === "Presentado";
    const hasPaseDefinitivo = student.documentos.pase_definitivo === "Presentado";
    apto = hasDni && hasCus && (hasCertPrimaria || hasPaseDefinitivo);
  }
  student.apto_titular = apto;

  const dbStudent = {
    dni: student.dni,
    apellido: student.apellido,
    nombre: student.nombre,
    fecha_nacimiento: student.fecha_nacimiento || null,
    edad: student.edad,
    telefono: student.telefono || null,
    domicilio: student.domicilio || null,
    correo: student.correo || null,
    ultima_escuela: student.ultima_escuela || null,
    nivel_educativo_finalizado: student.nivel_educativo_finalizado || null,
    motivo_secundario: student.motivo_secundario || null,
    ano_ingreso: student.ano_ingreso,
    ano_actual: student.ano_actual,
    division: student.division || "Única",
    estado: student.estado || "Activo",
    bibliorato: student.bibliorato || null,
    ano_apertura_legajo: student.ano_apertura_legajo ? parseInt(student.ano_apertura_legajo) : null,
    dni_presentado: student.documentos?.dni || "Pendiente",
    cus_presentado: student.documentos?.cus || "Pendiente",
    certificado_primaria: student.documentos?.certificado_primaria || "Pendiente",
    pase_provisorio: student.documentos?.pase_provisorio || "Pendiente",
    pase_definitivo: student.documentos?.pase_definitivo || "Pendiente",
    equivalencias_presentado: student.documentos?.equivalencias || "Pendiente",
    apto_titular: student.apto_titular || false,
    observaciones: student.observaciones || null
  };

  // Check if student exists
  const { data: existing } = await supabase
    .from("estudiantes")
    .select("dni")
    .eq("dni", student.dni)
    .maybeSingle();

  // Upsert Student
  const { error: studentError } = await supabase
    .from("estudiantes")
    .upsert(dbStudent);
  if (studentError) throw studentError;

  // Manage Previas: Delete and recreate to ensure perfect consistency
  const { error: deleteError } = await supabase
    .from("materias_previas")
    .delete()
    .eq("estudiante_dni", student.dni);
  if (deleteError) throw deleteError;

  if (student.previas && student.previas.length > 0) {
    const previasToInsert = student.previas.map(p => ({
      estudiante_dni: student.dni,
      nombre_materia: p.nombre_materia,
      ano_materia: p.ano_materia,
      tipo: p.tipo,
      estado: p.estado || "Pendiente",
      fecha_carga: p.fecha_carga ? p.fecha_carga.split("T")[0] : new Date().toISOString().split("T")[0],
      observaciones: p.observaciones || null
    }));
    const { error: previasError } = await supabase
      .from("materias_previas")
      .insert(previasToInsert);
    if (previasError) throw previasError;
  }

  // Audit Logs
  if (existing) {
    await addAuditLog(usuarioEmail, "EDITAR", "ESTUDIANTES", `Se modificó el legajo del estudiante ${student.apellido}, ${student.nombre} (DNI: ${student.dni})`);
  } else {
    await addAuditLog(usuarioEmail, "CREAR", "ESTUDIANTES", `Se creó el legajo del estudiante ${student.apellido}, ${student.nombre} (DNI: ${student.dni})`);
  }
};

export const deleteStudent = async (dni, nameString, usuarioEmail) => {
  const { error } = await supabase.from("estudiantes").delete().eq("dni", dni);
  if (error) throw error;
  await addAuditLog(usuarioEmail, "ELIMINAR", "ESTUDIANTES", `Se eliminó el legajo del estudiante (DNI: ${dni})`);
};

// 4. TEACHER SERVICES
export const getTeachers = async (filters = {}) => {
  const { data, error } = await supabase.from("profesores").select("*");
  if (error) throw error;
  
  const mappedTeachers = (data || []).map(t => {
    const documentos = {
      titulo: t.titulo_presentado || "Pendiente",
      incompatibilidad: t.incompatibilidad_presentado || "Pendiente",
      servicios: t.servicios_presentado || "Pendiente",
      delitos_sexuales: t.delitos_sexuales_presentado || "Pendiente"
    };
    
    return {
      ...t,
      documentos,
      materias: t.materias || [],
      anos_dicta: t.anos_dicta || []
    };
  });
  
  return applyTeacherFilters(mappedTeachers, filters);
};

const applyTeacherFilters = (teachers, filters) => {
  let result = [...teachers];

  if (filters.search) {
    const s = filters.search.toLowerCase();
    result = result.filter(t => 
      t.nombre.toLowerCase().includes(s) || 
      t.apellido.toLowerCase().includes(s) || 
      t.dni.toString().includes(s)
    );
  }
  if (filters.materia) {
    result = result.filter(t => t.materias && t.materias.some(m => m.toLowerCase().includes(filters.materia.toLowerCase())));
  }
  if (filters.ano_dicta) {
    result = result.filter(t => t.anos_dicta && t.anos_dicta.includes(filters.ano_dicta));
  }
  if (filters.area) {
    result = result.filter(t => t.area === filters.area);
  }
  if (filters.designacion) {
    result = result.filter(t => t.designacion === filters.designacion);
  }
  if (filters.estado) {
    result = result.filter(t => t.estado === filters.estado);
  }
  if (filters.documentacion_incompleta === "true") {
    result = result.filter(t => 
      t.documentos && (
        t.documentos.titulo === "Pendiente" ||
        t.documentos.incompatibilidad === "Pendiente" ||
        t.documentos.servicios === "Pendiente" ||
        t.documentos.delitos_sexuales === "Pendiente"
      )
    );
  }

  result.sort((a, b) => {
    const compA = `${a.apellido} ${a.nombre}`.toLowerCase();
    const compB = `${b.apellido} ${b.nombre}`.toLowerCase();
    return compA.localeCompare(compB);
  });

  return result;
};

export const saveTeacher = async (teacher, usuarioEmail) => {
  const dbTeacher = {
    dni: teacher.dni,
    cuil: teacher.cuil || null,
    apellido: teacher.apellido,
    nombre: teacher.nombre,
    domicilio: teacher.domicilio || null,
    telefono: teacher.telefono || null,
    correo: teacher.correo || null,
    folio: teacher.folio || null,
    designacion: teacher.designacion || "Titular",
    estado: teacher.estado || "Activo",
    observaciones: teacher.observaciones || null,
    titulo_presentado: teacher.documentos?.titulo || "Pendiente",
    incompatibilidad_presentado: teacher.documentos?.incompatibilidad || "Pendiente",
    servicios_presentado: teacher.documentos?.servicios || "Pendiente",
    delitos_sexuales_presentado: teacher.documentos?.delitos_sexuales || "Pendiente",
    materias: teacher.materias || [],
    anos_dicta: teacher.anos_dicta || [],
    area: teacher.area || null
  };

  const { data: existing } = await supabase
    .from("profesores")
    .select("dni")
    .eq("dni", teacher.dni)
    .maybeSingle();

  const { error } = await supabase.from("profesores").upsert(dbTeacher);
  if (error) throw error;

  if (existing) {
    await addAuditLog(usuarioEmail, "EDITAR", "PROFESORES", `Se modificó el legajo del docente ${teacher.apellido}, ${teacher.nombre} (DNI: ${teacher.dni})`);
  } else {
    await addAuditLog(usuarioEmail, "CREAR", "PROFESORES", `Se creó el legajo del docente ${teacher.apellido}, ${teacher.nombre} (DNI: ${teacher.dni})`);
  }
};

export const deleteTeacher = async (dni, usuarioEmail) => {
  const { error } = await supabase.from("profesores").delete().eq("dni", dni);
  if (error) throw error;
  await addAuditLog(usuarioEmail, "ELIMINAR", "PROFESORES", `Se eliminó el legajo del profesor (DNI: ${dni})`);
};

// 5. SCHEDULE SERVICES
export const getSchedules = async () => {
  const { data: rows, error } = await supabase
    .from("horarios")
    .select(`
      id, ano, division, turno, dia, hora_inicio, hora_fin, materia, profesor_dni,
      profesores ( nombre, apellido )
    `);
    
  if (error) throw error;
  
  // Group rows back into blocks as the frontend expects
  const groups = {};
  (rows || []).forEach(row => {
    const key = `${row.ano}_${row.division}_${row.turno}`;
    if (!groups[key]) {
      groups[key] = {
        ano: row.ano,
        division: row.division,
        turno: row.turno,
        rawRows: []
      };
    }
    groups[key].rawRows.push(row);
  });
  
  const schedulesList = Object.values(groups).map(g => {
    const blocksMap = {};
    g.rawRows.forEach(row => {
      const bKey = `${row.hora_inicio}_${row.hora_fin}`;
      if (!blocksMap[bKey]) {
        blocksMap[bKey] = {
          inicio: row.hora_inicio,
          fin: row.hora_fin,
          dias: {
            Lunes: null,
            Martes: null,
            Miércoles: null,
            Jueves: null,
            Viernes: null
          }
        };
      }
      
      const profName = row.profesores ? `${row.profesores.nombre} ${row.profesores.apellido}` : "";
      blocksMap[bKey].dias[row.dia] = {
        materia: row.materia,
        profesor: profName,
        profesorDni: row.profesor_dni || ""
      };
    });
    
    const bloques = Object.values(blocksMap).sort((a, b) => a.inicio.localeCompare(b.inicio));
    
    return {
      id: `${g.ano.replace("°", "")}_${g.division.toLowerCase()}_${g.turno.toLowerCase()}`,
      ano: g.ano,
      division: g.division,
      turno: g.turno,
      bloques: bloques
    };
  });
  
  return schedulesList;
};

export const saveSchedule = async (schedule, usuarioEmail) => {
  // Delete existing horarios for this specific group
  const { error: deleteError } = await supabase
    .from("horarios")
    .delete()
    .eq("ano", schedule.ano)
    .eq("division", schedule.division)
    .eq("turno", schedule.turno);
    
  if (deleteError) throw deleteError;

  const rowsToInsert = [];
  if (schedule.bloques) {
    schedule.bloques.forEach(block => {
      const { inicio, fin, dias } = block;
      if (dias) {
        Object.entries(dias).forEach(([dia, classInfo]) => {
          if (classInfo) {
            rowsToInsert.push({
              ano: schedule.ano,
              division: schedule.division,
              turno: schedule.turno,
              dia: dia,
              hora_inicio: inicio,
              hora_fin: fin,
              materia: classInfo.materia,
              profesor_dni: classInfo.profesorDni || null
            });
          }
        });
      }
    });
  }

  if (rowsToInsert.length > 0) {
    const { error: insertError } = await supabase.from("horarios").insert(rowsToInsert);
    if (insertError) throw insertError;
  }
  
  await addAuditLog(usuarioEmail, "EDITAR", "HORARIOS", `Se actualizaron los horarios de ${schedule.ano} año división ${schedule.division} - Turno ${schedule.turno}`);
};

// 6. NEWS SERVICES
export const getNews = async () => {
  const { data, error } = await supabase
    .from("novedades")
    .select("*")
    .order("destacado", { ascending: false })
    .order("fecha_publicacion", { ascending: false });
    
  if (error) throw error;
  return data || [];
};

export const saveNews = async (item, usuarioEmail) => {
  if (!item.id) {
    item.id = `news_${Date.now()}`;
    item.fecha_publicacion = new Date().toISOString();
  }
  
  const { data: existing } = await supabase
    .from("novedades")
    .select("id")
    .eq("id", item.id)
    .maybeSingle();

  const { error } = await supabase.from("novedades").upsert(item);
  if (error) throw error;
  
  if (existing) {
    await addAuditLog(usuarioEmail, "EDITAR", "NOVEDADES", `Se editó la noticia: "${item.titulo}"`);
  } else {
    await addAuditLog(usuarioEmail, "CREAR", "NOVEDADES", `Se publicó una nueva noticia: "${item.titulo}"`);
  }
};

export const deleteNews = async (id, usuarioEmail) => {
  const { data: item } = await supabase
    .from("novedades")
    .select("titulo")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("novedades").delete().eq("id", id);
  if (error) throw error;

  const title = item ? item.titulo : id;
  await addAuditLog(usuarioEmail, "ELIMINAR", "NOVEDADES", `Se eliminó la noticia: "${title}"`);
};

// 7. SEED DATABASE FUNCTION
export const seedDatabase = async (seedJson, usuarioEmail) => {
  const { estudiantes, profesores, horarios } = seedJson;
  
  // 1. Seed Teachers
  const dbTeachers = profesores.map(t => ({
    dni: t.dni,
    cuil: t.cuil || null,
    apellido: t.apellido,
    nombre: t.nombre,
    domicilio: t.domicilio || null,
    telefono: t.telefono || null,
    correo: t.correo || null,
    folio: t.folio || null,
    designacion: t.designacion || "Titular",
    estado: t.estado || "Activo",
    observaciones: t.observaciones || null,
    titulo_presentado: t.documentos?.titulo || "Pendiente",
    incompatibilidad_presentado: t.documentos?.incompatibilidad || "Pendiente",
    servicios_presentado: t.documentos?.servicios || "Pendiente",
    delitos_sexuales_presentado: t.documentos?.delitos_sexuales || "Pendiente",
    materias: t.materias || [],
    anos_dicta: t.anos_dicta || [],
    area: t.area || null
  }));
  
  const { error: profError } = await supabase.from("profesores").upsert(dbTeachers);
  if (profError) throw profError;
  
  // 2. Seed Students
  const dbStudents = estudiantes.map(s => ({
    dni: s.dni,
    apellido: s.apellido,
    nombre: s.nombre,
    fecha_nacimiento: s.fecha_nacimiento || null,
    edad: s.edad || null,
    telefono: s.telefono || null,
    domicilio: s.domicilio || null,
    correo: s.correo || null,
    ultima_escuela: s.ultima_escuela || null,
    nivel_educativo_finalizado: s.nivel_educativo_finalizado || null,
    motivo_secundario: s.motivo_secundario || null,
    ano_ingreso: s.ano_ingreso,
    ano_actual: s.ano_actual,
    division: s.division || "Única",
    turno: s.turno || "Noche",
    estado: s.estado || "Activo",
    bibliorato: s.bibliorato || null,
    ano_apertura_legajo: s.ano_apertura_legajo || null,
    dni_presentado: s.documentos?.dni || "Pendiente",
    cus_presentado: s.documentos?.cus || "Pendiente",
    certificado_primaria: s.documentos?.certificado_primaria || "Pendiente",
    pase_provisorio: s.documentos?.pase_provisorio || "Pendiente",
    pase_definitivo: s.documentos?.pase_definitivo || "Pendiente",
    apto_titular: s.apto_titular || false,
    observaciones: s.observaciones || null
  }));
  
  const { error: studError } = await supabase.from("estudiantes").upsert(dbStudents);
  if (studError) throw studError;
  
  // 3. Seed student previas
  // Collect all previas
  const previasToInsert = [];
  estudiantes.forEach(s => {
    if (s.previas && s.previas.length > 0) {
      s.previas.forEach(p => {
        previasToInsert.push({
          estudiante_dni: s.dni,
          nombre_materia: p.nombre_materia,
          ano_materia: p.ano_materia,
          tipo: p.tipo,
          estado: p.estado || "Pendiente",
          fecha_carga: p.fecha_carga ? p.fecha_carga.split("T")[0] : new Date().toISOString().split("T")[0],
          observaciones: p.observaciones || null
        });
      });
    }
  });
  
  if (previasToInsert.length > 0) {
    // Clean all current previas first
    const studentDnis = estudiantes.map(s => s.dni);
    await supabase.from("materias_previas").delete().in("estudiante_dni", studentDnis);
    
    // Insert new ones in batches of 100
    const batchSize = 100;
    for (let i = 0; i < previasToInsert.length; i += batchSize) {
      const chunk = previasToInsert.slice(i, i + batchSize);
      const { error: prevError } = await supabase.from("materias_previas").insert(chunk);
      if (prevError) throw prevError;
    }
  }
  
  // 4. Seed Schedules
  // Clean all horarios
  await supabase.from("horarios").delete().neq("ano", "None");
  
  const schedulesToInsert = [];
  horarios.forEach(schedule => {
    if (schedule.bloques) {
      schedule.bloques.forEach(block => {
        const { inicio, fin, dias } = block;
        if (dias) {
          Object.entries(dias).forEach(([dia, classInfo]) => {
            if (classInfo) {
              schedulesToInsert.push({
                ano: schedule.ano,
                division: schedule.division,
                turno: schedule.turno,
                dia: dia,
                hora_inicio: inicio,
                hora_fin: fin,
                materia: classInfo.materia,
                profesor_dni: classInfo.profesorDni || null
              });
            }
          });
        }
      });
    }
  });
  
  if (schedulesToInsert.length > 0) {
    const batchSize = 100;
    for (let i = 0; i < schedulesToInsert.length; i += batchSize) {
      const chunk = schedulesToInsert.slice(i, i + batchSize);
      const { error: schedError } = await supabase.from("horarios").insert(chunk);
      if (schedError) throw schedError;
    }
  }
  
  await addAuditLog(usuarioEmail, "MIGRACION", "CONFIGURACION", "Se realizó el sembrado inicial completo de datos en Supabase (PostgreSQL)");
};

// 8. CALENDAR CUSTOM EVENTS PERSISTENCE
export const getCustomEvents = async () => {
  const { data, error } = await supabase.from("eventos_calendario").select("*");
  if (error) {
    console.error("Error fetching events from Supabase:", error);
    return [];
  }
  
  const MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  
  // Map DB schema to frontend schema
  return (data || []).map(evt => {
    let mesStr = "";
    let fechaStr = "";
    if (evt.fecha_inicio) {
      const d = new Date(evt.fecha_inicio + "T00:00:00");
      mesStr = MONTHS[d.getMonth()] || "";
      fechaStr = d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
    }
    return {
      id: evt.id,
      titulo: evt.titulo,
      tipo: evt.tipo,
      startDate: evt.fecha_inicio,
      endDate: evt.fecha_fin,
      mes: mesStr,
      fecha: fechaStr
    };
  });
};

export const saveCustomEvent = async (event, usuarioEmail) => {
  if (!event.id) {
    event.id = `evt_${Date.now()}`;
  }
  
  const { data: existing } = await supabase
    .from("eventos_calendario")
    .select("id")
    .eq("id", event.id)
    .maybeSingle();

  // Map frontend schema to DB schema
  const dbEvent = {
    id: event.id,
    titulo: event.titulo,
    tipo: event.tipo,
    fecha_inicio: event.startDate,
    fecha_fin: event.endDate,
    color: "",
    descripcion: ""
  };

  const { error } = await supabase.from("eventos_calendario").upsert(dbEvent);
  if (error) throw error;
  
  if (existing) {
    await addAuditLog(usuarioEmail, "EDITAR", "CALENDARIO", `Se editó el evento personalizado: "${event.titulo}"`);
  } else {
    await addAuditLog(usuarioEmail, "CREAR", "CALENDARIO", `Se creó el evento personalizado: "${event.titulo}"`);
  }
  
  return event;
};

export const deleteCustomEvent = async (id, usuarioEmail) => {
  const { data: item } = await supabase
    .from("eventos_calendario")
    .select("titulo")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("eventos_calendario").delete().eq("id", id);
  if (error) throw error;
  
  if (item) {
    await addAuditLog(usuarioEmail, "ELIMINAR", "CALENDARIO", `Se eliminó el evento personalizado: "${item.titulo}"`);
  }
};

// 9. ADMIN TODO LIST PERSISTENCE
export const getAdminTasks = async () => {
  const { data, error } = await supabase.from("tareas_admin").select("*");
  if (error) {
    console.error("Error fetching tasks from Supabase:", error);
    return [];
  }
  
  // Map DB schema to frontend schema
  return (data || []).map(task => ({
    ...task,
    fecha_limite: task.fecha_vencimiento,
    // Provide fallback for any missing field
    descripcion: task.descripcion || ""
  }));
};

export const saveAdminTask = async (task, usuarioEmail) => {
  if (!task.id) {
    task.id = `tsk_${Date.now()}`;
    task.fecha_creacion = new Date().toISOString();
  }
  
  const { data: existing } = await supabase
    .from("tareas_admin")
    .select("id")
    .eq("id", task.id)
    .maybeSingle();

  // Map frontend schema to DB schema
  const dbTask = {
    id: task.id,
    titulo: task.titulo,
    descripcion: task.descripcion || "",
    completada: task.completada || false,
    fecha_creacion: task.fecha_creacion,
    fecha_vencimiento: task.fecha_limite || null,
    prioridad: task.prioridad || "Media"
  };

  const { error } = await supabase.from("tareas_admin").upsert(dbTask);
  if (error) throw error;
  
  if (existing) {
    await addAuditLog(usuarioEmail, "EDITAR", "TAREAS", `Se modificó la tarea: "${task.titulo}"`);
  } else {
    await addAuditLog(usuarioEmail, "CREAR", "TAREAS", `Se creó la tarea: "${task.titulo}"`);
  }
  return task;
};

export const deleteAdminTask = async (id, usuarioEmail) => {
  const { data: item } = await supabase
    .from("tareas_admin")
    .select("titulo")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("tareas_admin").delete().eq("id", id);
  if (error) throw error;
  
  if (item) {
    await addAuditLog(usuarioEmail, "ELIMINAR", "TAREAS", `Se eliminó la tarea: "${item.titulo}"`);
  }
};
