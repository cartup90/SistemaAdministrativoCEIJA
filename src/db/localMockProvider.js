// src/db/localMockProvider.js
import seedData from "../../seed_data.json";

const MOCK_STORAGE_KEYS = {
  STUDENTS: "sisgest_students",
  TEACHERS: "sisgest_teachers",
  SCHEDULES: "sisgest_schedules",
  NEWS: "sisgest_news",
  LOGS: "sisgest_logs",
  USER: "sisgest_user",
  CALENDAR_EVENTS: "sisgest_calendar_events",
  TODO: "sisgest_admin_tasks"
};

export const initializeMockData = () => {
  const currentStudents = localStorage.getItem(MOCK_STORAGE_KEYS.STUDENTS);
  if (!currentStudents || JSON.parse(currentStudents).length === 0) {
    localStorage.setItem(MOCK_STORAGE_KEYS.STUDENTS, JSON.stringify(seedData.estudiantes || []));
  }
  
  const currentTeachers = localStorage.getItem(MOCK_STORAGE_KEYS.TEACHERS);
  if (!currentTeachers || JSON.parse(currentTeachers).length === 0) {
    localStorage.setItem(MOCK_STORAGE_KEYS.TEACHERS, JSON.stringify(seedData.profesores || []));
  }
  
  const currentSchedules = localStorage.getItem(MOCK_STORAGE_KEYS.SCHEDULES);
  if (!currentSchedules || JSON.parse(currentSchedules).length === 0) {
    localStorage.setItem(MOCK_STORAGE_KEYS.SCHEDULES, JSON.stringify(seedData.horarios || []));
  }

  const currentUsersRaw = localStorage.getItem("sisgest_users");
  let needUsersSeeding = !currentUsersRaw;
  if (currentUsersRaw) {
    try {
      const parsed = JSON.parse(currentUsersRaw);
      const hasOldAdmin = parsed.some(u => u.email.toLowerCase().includes("admin@ceija"));
      const hasNewAdmin = parsed.some(u => u.email.toLowerCase() === "cartup90@gmail.com");
      if (hasOldAdmin || !hasNewAdmin) {
        needUsersSeeding = true;
      }
    } catch {
      needUsersSeeding = true;
    }
  }

  if (needUsersSeeding) {
    const defaultUsers = [
      { email: "cartup90@gmail.com", role: "admin", password: "admin123" },
      { email: "docente@ceija.edu.ar", role: "comun", password: "docente123" }
    ];
    localStorage.setItem("sisgest_users", JSON.stringify(defaultUsers));
  }

  if (!localStorage.getItem(MOCK_STORAGE_KEYS.NEWS)) {
    localStorage.setItem(MOCK_STORAGE_KEYS.NEWS, JSON.stringify([
      {
        id: "news_1",
        titulo: "¡Bienvenidos al Ciclo Lectivo 2026!",
        cuerpo: "Les damos la bienvenida a todos los estudiantes y docentes del CEIJA N° 12 Anexo Alberdi. Esperamos que este año académico sea muy fructífero para todos.",
        fecha_publicacion: new Date().toISOString(),
        destacado: true
      }
    ]));
  }
  if (!localStorage.getItem(MOCK_STORAGE_KEYS.LOGS)) {
    localStorage.setItem(MOCK_STORAGE_KEYS.LOGS, JSON.stringify([]));
  }
};

const getMockItems = (key) => JSON.parse(localStorage.getItem(key) || "[]");
const saveMockItems = (key, items) => localStorage.setItem(key, JSON.stringify(items));

// AUTHENTICATION
export const login = async (email, password) => {
  const normalizedEmail = email.toLowerCase().trim();
  const users = JSON.parse(localStorage.getItem("sisgest_users") || "[]");
  
  const matchedUser = users.find(u => u.email.toLowerCase() === normalizedEmail);
  if (!matchedUser) {
    throw new Error("Usuario no registrado en el sistema.");
  }
  
  if (matchedUser.password !== password) {
    throw new Error("Contraseña incorrecta. Verifique sus credenciales.");
  }
  
  const mockUser = {
    uid: matchedUser.uid || `mock_uid_${matchedUser.email}`,
    email: matchedUser.email,
    role: matchedUser.role
  };
  
  localStorage.setItem(MOCK_STORAGE_KEYS.USER, JSON.stringify(mockUser));
  if (authChangeCallback) authChangeCallback(mockUser);
  return mockUser;
};

export const logout = async () => {
  localStorage.removeItem(MOCK_STORAGE_KEYS.USER);
  if (authChangeCallback) authChangeCallback(null);
};

let authChangeCallback = null;
export const onAuthChange = (callback) => {
  authChangeCallback = callback;
  const cachedUser = localStorage.getItem(MOCK_STORAGE_KEYS.USER);
  if (cachedUser) {
    callback(JSON.parse(cachedUser));
  } else {
    callback(null);
  }
  return () => { authChangeCallback = null; };
};

export const createUser = async (email, password, role, usuarioEmail) => {
  const users = JSON.parse(localStorage.getItem("sisgest_users") || "[]");
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error("El usuario ya existe en el sistema.");
  }
  
  users.push({
    uid: `mock_uid_${Date.now()}`,
    email: email.toLowerCase().trim(),
    password: password,
    role: role
  });
  localStorage.setItem("sisgest_users", JSON.stringify(users));
  await addAuditLog(usuarioEmail, "CREAR_USUARIO", "CONFIGURACION", `Se registró el usuario ${email} con rol ${role}`);
};

export const changePassword = async (currentPassword, newPassword) => {
  const cachedUser = JSON.parse(localStorage.getItem(MOCK_STORAGE_KEYS.USER));
  if (cachedUser) {
    const users = JSON.parse(localStorage.getItem("sisgest_users") || "[]");
    const idx = users.findIndex(u => u.email.toLowerCase() === cachedUser.email.toLowerCase());
    if (idx !== -1) {
      if (users[idx].password !== currentPassword) {
        throw new Error("La contraseña actual es incorrecta.");
      }
      users[idx].password = newPassword;
      localStorage.setItem("sisgest_users", JSON.stringify(users));
      await addAuditLog(cachedUser.email, "CONFIGURACION", "USUARIOS", "El usuario cambió su contraseña");
    } else {
      throw new Error("Usuario no encontrado en la base de datos simulada.");
    }
  } else {
    throw new Error("No hay usuario autenticado.");
  }
};

// AUDIT LOGS
export const addAuditLog = async (usuarioEmail, accion, modulo, descripcion) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    usuario_email: usuarioEmail,
    accion: accion,
    modulo: modulo,
    descripcion: descripcion
  };
  const logs = getMockItems(MOCK_STORAGE_KEYS.LOGS);
  logs.unshift({ id: `log_${Date.now()}`, ...logEntry });
  saveMockItems(MOCK_STORAGE_KEYS.LOGS, logs);
};

export const getAuditLogs = async () => {
  return getMockItems(MOCK_STORAGE_KEYS.LOGS);
};

// STUDENTS
export const getStudents = async (filters = {}) => {
  const students = getMockItems(MOCK_STORAGE_KEYS.STUDENTS);
  const processedStudents = students.map(st => {
    let apto = false;
    if (st.documentos) {
      const hasDni = st.documentos.dni === "Presentado";
      const hasCus = st.documentos.cus === "Presentado";
      const hasCertPrimaria = st.documentos.certificado_primaria === "Presentado";
      const hasPaseDefinitivo = st.documentos.pase_definitivo === "Presentado";
      apto = hasDni && hasCus && (hasCertPrimaria || hasPaseDefinitivo);
    }
    return { ...st, apto_titular: apto };
  });
  return applyStudentFilters(processedStudents, filters);
};

export const getStudentPublicInfo = async (dni) => {
  const students = getMockItems(MOCK_STORAGE_KEYS.STUDENTS);
  const student = students.find(s => s.dni.toString() === dni.toString());
  if (student) {
    return {
      dni: student.dni,
      nombre: student.nombre,
      apellido: student.apellido,
      ano_actual: student.ano_actual,
      division: student.division,
      turno: student.turno,
      estado: student.estado,
      documentos: student.documentos || {},
      previas: student.previas || []
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
  if (filters.turno) {
    result = result.filter(st => st.turno === filters.turno);
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

  const students = getMockItems(MOCK_STORAGE_KEYS.STUDENTS);
  const idx = students.findIndex(s => s.dni === student.dni);
  if (idx !== -1) {
    students[idx] = student;
    await addAuditLog(usuarioEmail, "EDITAR", "ESTUDIANTES", `Se modificó el legajo del estudiante ${student.apellido}, ${student.nombre} (DNI: ${student.dni})`);
  } else {
    students.push(student);
    await addAuditLog(usuarioEmail, "CREAR", "ESTUDIANTES", `Se creó el legajo del estudiante ${student.apellido}, ${student.nombre} (DNI: ${student.dni})`);
  }
  saveMockItems(MOCK_STORAGE_KEYS.STUDENTS, students);
};

export const deleteStudent = async (dni, nameString, usuarioEmail) => {
  let students = getMockItems(MOCK_STORAGE_KEYS.STUDENTS);
  students = students.filter(s => s.dni !== dni);
  saveMockItems(MOCK_STORAGE_KEYS.STUDENTS, students);
  await addAuditLog(usuarioEmail, "ELIMINAR", "ESTUDIANTES", `Se eliminó el legajo del estudiante (DNI: ${dni})`);
};

// TEACHERS
export const getTeachers = async (filters = {}) => {
  const teachers = getMockItems(MOCK_STORAGE_KEYS.TEACHERS);
  return applyTeacherFilters(teachers, filters);
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
  const teachers = getMockItems(MOCK_STORAGE_KEYS.TEACHERS);
  const idx = teachers.findIndex(t => t.dni === teacher.dni);
  if (idx !== -1) {
    teachers[idx] = teacher;
    await addAuditLog(usuarioEmail, "EDITAR", "PROFESORES", `Se modificó el legajo del docente ${teacher.apellido}, ${teacher.nombre} (DNI: ${teacher.dni})`);
  } else {
    teachers.push(teacher);
    await addAuditLog(usuarioEmail, "CREAR", "PROFESORES", `Se creó el legajo del docente ${teacher.apellido}, ${teacher.nombre} (DNI: ${teacher.dni})`);
  }
  saveMockItems(MOCK_STORAGE_KEYS.TEACHERS, teachers);
};

export const deleteTeacher = async (dni, usuarioEmail) => {
  let teachers = getMockItems(MOCK_STORAGE_KEYS.TEACHERS);
  teachers = teachers.filter(t => t.dni !== dni);
  saveMockItems(MOCK_STORAGE_KEYS.TEACHERS, teachers);
  await addAuditLog(usuarioEmail, "ELIMINAR", "PROFESORES", `Se eliminó el legajo del profesor (DNI: ${dni})`);
};

// SCHEDULES
export const getSchedules = async () => {
  return getMockItems(MOCK_STORAGE_KEYS.SCHEDULES);
};

export const saveSchedule = async (schedule, usuarioEmail) => {
  const schedules = getMockItems(MOCK_STORAGE_KEYS.SCHEDULES);
  const idx = schedules.findIndex(s => s.ano === schedule.ano && s.division === schedule.division && s.turno === schedule.turno);
  if (idx !== -1) {
    schedules[idx] = schedule;
  } else {
    schedules.push(schedule);
  }
  saveMockItems(MOCK_STORAGE_KEYS.SCHEDULES, schedules);
  await addAuditLog(usuarioEmail, "EDITAR", "HORARIOS", `Se actualizaron los horarios de ${schedule.ano} año división ${schedule.division} - Turno ${schedule.turno}`);
};

// NEWS
export const getNews = async () => {
  const news = getMockItems(MOCK_STORAGE_KEYS.NEWS);
  news.sort((a, b) => {
    if (a.destacado && !b.destacado) return -1;
    if (!a.destacado && b.destacado) return 1;
    return new Date(b.fecha_publicacion) - new Date(a.fecha_publicacion);
  });
  return news;
};

export const saveNews = async (item, usuarioEmail) => {
  if (!item.id) {
    item.id = `news_${Date.now()}`;
    item.fecha_publicacion = new Date().toISOString();
  }
  const news = getMockItems(MOCK_STORAGE_KEYS.NEWS);
  const idx = news.findIndex(n => n.id === item.id);
  if (idx !== -1) {
    news[idx] = item;
    await addAuditLog(usuarioEmail, "EDITAR", "NOVEDADES", `Se editó la noticia: "${item.titulo}"`);
  } else {
    news.unshift(item);
    await addAuditLog(usuarioEmail, "CREAR", "NOVEDADES", `Se publicó una nueva noticia: "${item.titulo}"`);
  }
  saveMockItems(MOCK_STORAGE_KEYS.NEWS, news);
};

export const deleteNews = async (id, usuarioEmail) => {
  let news = getMockItems(MOCK_STORAGE_KEYS.NEWS);
  const item = news.find(n => n.id === id);
  news = news.filter(n => n.id !== id);
  saveMockItems(MOCK_STORAGE_KEYS.NEWS, news);
  if (item) {
    await addAuditLog(usuarioEmail, "ELIMINAR", "NOVEDADES", `Se eliminó la noticia: "${item.titulo}"`);
  }
};

// SEED DATABASE
export const seedDatabase = async (seedJson, usuarioEmail) => {
  const { estudiantes, profesores, horarios } = seedJson;
  localStorage.setItem(MOCK_STORAGE_KEYS.STUDENTS, JSON.stringify(estudiantes));
  localStorage.setItem(MOCK_STORAGE_KEYS.TEACHERS, JSON.stringify(profesores));
  localStorage.setItem(MOCK_STORAGE_KEYS.SCHEDULES, JSON.stringify(horarios));
  await addAuditLog(usuarioEmail, "MIGRACION", "CONFIGURACION", "Se realizó el sembrado inicial de datos en base de datos local (Mock)");
};

// CALENDAR
export const getCustomEvents = async () => {
  return getMockItems(MOCK_STORAGE_KEYS.CALENDAR_EVENTS);
};

export const saveCustomEvent = async (event, usuarioEmail) => {
  if (!event.id) {
    event.id = `evt_${Date.now()}`;
  }
  const events = getMockItems(MOCK_STORAGE_KEYS.CALENDAR_EVENTS);
  const idx = events.findIndex(e => e.id === event.id);
  if (idx !== -1) {
    events[idx] = event;
    await addAuditLog(usuarioEmail, "EDITAR", "CALENDARIO", `Se editó el evento personalizado: "${event.titulo}"`);
  } else {
    events.push(event);
    await addAuditLog(usuarioEmail, "CREAR", "CALENDARIO", `Se creó el evento personalizado: "${event.titulo}"`);
  }
  saveMockItems(MOCK_STORAGE_KEYS.CALENDAR_EVENTS, events);
  return event;
};

export const deleteCustomEvent = async (id, usuarioEmail) => {
  let events = getMockItems(MOCK_STORAGE_KEYS.CALENDAR_EVENTS);
  const event = events.find(e => e.id === id);
  events = events.filter(e => e.id !== id);
  saveMockItems(MOCK_STORAGE_KEYS.CALENDAR_EVENTS, events);
  if (event) {
    await addAuditLog(usuarioEmail, "ELIMINAR", "CALENDARIO", `Se eliminó el evento personalizado: "${event.titulo}"`);
  }
};

// TODO TASKS
export const getAdminTasks = async () => {
  return getMockItems(MOCK_STORAGE_KEYS.TODO);
};

export const saveAdminTask = async (task, usuarioEmail) => {
  if (!task.id) {
    task.id = `tsk_${Date.now()}`;
    task.fecha_creacion = new Date().toISOString();
  }
  const tasks = getMockItems(MOCK_STORAGE_KEYS.TODO);
  const idx = tasks.findIndex(t => t.id === task.id);
  if (idx !== -1) {
    tasks[idx] = task;
    await addAuditLog(usuarioEmail, "EDITAR", "TAREAS", `Se modificó la tarea: "${task.titulo}"`);
  } else {
    tasks.push(task);
    await addAuditLog(usuarioEmail, "CREAR", "TAREAS", `Se creó la tarea: "${task.titulo}"`);
  }
  saveMockItems(MOCK_STORAGE_KEYS.TODO, tasks);
  return task;
};

export const deleteAdminTask = async (id, usuarioEmail) => {
  let tasks = getMockItems(MOCK_STORAGE_KEYS.TODO);
  const task = tasks.find(t => t.id === id);
  tasks = tasks.filter(t => t.id !== id);
  saveMockItems(MOCK_STORAGE_KEYS.TODO, tasks);
  if (task) {
    await addAuditLog(usuarioEmail, "ELIMINAR", "TAREAS", `Se eliminó la tarea: "${task.titulo}"`);
  }
};
