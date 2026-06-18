// src/firebase.js
import { initializeApp, getApp, getApps } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updatePassword
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  writeBatch
} from "firebase/firestore";

// Firebase Configuration via Environment Variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Check if credentials are provided and valid
const isRealFirebaseConfigured = 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== "YOUR_API_KEY" && 
  firebaseConfig.projectId;

let app;
let auth;
let db;
let isMock = true;

if (isRealFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    isMock = false;
    console.log("SisGest: Connected to Real Firebase Database.");
  } catch (error) {
    console.error("SisGest: Error initializing Firebase, falling back to Mock Mode:", error);
    isMock = true;
  }
} else {
  console.log("SisGest: Firebase environment variables not configured. Running in local Mock Mode.");
  isMock = true;
}

// ============================================================================
// LOCAL STORAGE MOCK IMPLEMENTATION
// ============================================================================

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

import seedData from "../seed_data.json";

const initializeMockData = () => {
  // If local storage is empty or empty array, seed it automatically from seed_data.json
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

  // Seed mock users if not present, or if legacy credentials exist
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

if (isMock) {
  initializeMockData();
}

// Helpers for mock database
const getMockItems = (key) => JSON.parse(localStorage.getItem(key) || "[]");
const saveMockItems = (key, items) => localStorage.setItem(key, JSON.stringify(items));

// ============================================================================
// SERVICE INTERFACE FUNCTIONS
// ============================================================================

export { isMock };

// 1. AUTHENTICATION SERVICES
export const login = async (email, password) => {
  if (!isMock) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    // Fetch user role from Firestore /users/[uid]
    const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
    const role = userDoc.exists() ? userDoc.data().role : "comun";
    return {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      role: role
    };
  } else {
    // Simulated auth in Mock Mode
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
    // Trigger simulated auth state change
    if (authChangeCallback) authChangeCallback(mockUser);
    return mockUser;
  }
};

export const logout = async () => {
  if (!isMock) {
    await signOut(auth);
  } else {
    localStorage.removeItem(MOCK_STORAGE_KEYS.USER);
    if (authChangeCallback) authChangeCallback(null);
  }
};

let authChangeCallback = null;
export const onAuthChange = (callback) => {
  authChangeCallback = callback;
  if (!isMock) {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch role
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        const role = userDoc.exists() ? userDoc.data().role : "comun";
        callback({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          role: role
        });
      } else {
        callback(null);
      }
    });
  } else {
    const cachedUser = localStorage.getItem(MOCK_STORAGE_KEYS.USER);
    if (cachedUser) {
      callback(JSON.parse(cachedUser));
    } else {
      callback(null);
    }
    // Return unsubscribe mock
    return () => { authChangeCallback = null; };
  }
};

export const createUser = async (email, password, role, usuarioEmail) => {
  if (!isMock) {
    const userRef = doc(db, "users", `uid_${email}`);
    await setDoc(userRef, { email, role });
    await addDoc(collection(db, "logs_auditoria"), {
      timestamp: new Date().toISOString(),
      usuario_email: usuarioEmail,
      accion: "CREAR_USUARIO",
      modulo: "CONFIGURACION",
      descripcion: `Se registró el usuario ${email} con rol ${role}`
    });
  } else {
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
  }
};

export const changePassword = async (currentPassword, newPassword) => {
  if (!isMock) {
    const currentUser = auth.currentUser;
    if (currentUser) {
      await updatePassword(currentUser, newPassword);
    } else {
      throw new Error("No hay usuario autenticado.");
    }
  } else {
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
  }
};

// 2. AUDIT LOG SERVICES
export const addAuditLog = async (usuarioEmail, accion, modulo, descripcion) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    usuario_email: usuarioEmail,
    accion: accion,
    modulo: modulo,
    descripcion: descripcion
  };

  if (!isMock) {
    try {
      await addDoc(collection(db, "logs_auditoria"), logEntry);
    } catch (e) {
      console.error("Error writing audit log:", e);
    }
  } else {
    const logs = getMockItems(MOCK_STORAGE_KEYS.LOGS);
    logs.unshift({ id: `log_${Date.now()}`, ...logEntry });
    saveMockItems(MOCK_STORAGE_KEYS.LOGS, logs);
  }
};

export const getAuditLogs = async () => {
  if (!isMock) {
    const q = query(collection(db, "logs_auditoria"), orderBy("timestamp", "desc"), limit(200));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } else {
    return getMockItems(MOCK_STORAGE_KEYS.LOGS);
  }
};

// 3. STUDENT SERVICES
export const getStudents = async (filters = {}) => {
  let students = [];
  if (!isMock) {
    let q = collection(db, "estudiantes");
    const snap = await getDocs(q);
    students = snap.docs.map(doc => ({ ...doc.data() }));
  } else {
    students = getMockItems(MOCK_STORAGE_KEYS.STUDENTS);
  }

  // Calculate apto_titular dynamically for all students
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
  let student = null;
  if (!isMock) {
    const docRef = doc(db, "estudiantes", dni);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      student = docSnap.data();
    }
  } else {
    const students = getMockItems(MOCK_STORAGE_KEYS.STUDENTS);
    student = students.find(s => s.dni.toString() === dni.toString());
  }

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
    // Si/No/Parcial
    result = result.filter(st => {
      if (!st.documentos) return false;
      const docs = Object.values(st.documentos);
      const requiredDocs = docs.filter(d => d !== "No aplica");
      const presentedDocs = requiredDocs.filter(d => d === "Presentado" || d === "Reemplazado");
      
      const isComplete = presentedDocs.length === requiredDocs.length;
      const isNone = presentedDocs.length === 0;
      
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

  // Sort by Apellido then Nombre
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

  // Apto para titular logic
  // Universal rule: DNI + CUS + (Certificado Primaria OR Pase Definitivo)
  let apto = false;
  if (student.documentos) {
    const hasDni = student.documentos.dni === "Presentado";
    const hasCus = student.documentos.cus === "Presentado";
    const hasCertPrimaria = student.documentos.certificado_primaria === "Presentado";
    const hasPaseDefinitivo = student.documentos.pase_definitivo === "Presentado";
    apto = hasDni && hasCus && (hasCertPrimaria || hasPaseDefinitivo);
  }
  student.apto_titular = apto;

  if (!isMock) {
    await setDoc(doc(db, "estudiantes", student.dni), student);
  } else {
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
  }
};

export const deleteStudent = async (dni, nameString, usuarioEmail) => {
  if (!isMock) {
    await deleteDoc(doc(db, "estudiantes", dni));
  } else {
    let students = getMockItems(MOCK_STORAGE_KEYS.STUDENTS);
    students = students.filter(s => s.dni !== dni);
    saveMockItems(MOCK_STORAGE_KEYS.STUDENTS, students);
    await addAuditLog(usuarioEmail, "ELIMINAR", "ESTUDIANTES", `Se eliminó el legajo del estudiante (DNI: ${dni})`);
  }
};

// 4. TEACHER SERVICES
export const getTeachers = async (filters = {}) => {
  if (!isMock) {
    const snap = await getDocs(collection(db, "profesores"));
    const teachers = snap.docs.map(doc => ({ ...doc.data() }));
    return applyTeacherFilters(teachers, filters);
  } else {
    const teachers = getMockItems(MOCK_STORAGE_KEYS.TEACHERS);
    return applyTeacherFilters(teachers, filters);
  }
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
  if (!isMock) {
    await setDoc(doc(db, "profesores", teacher.dni), teacher);
  } else {
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
  }
};

export const deleteTeacher = async (dni, usuarioEmail) => {
  if (!isMock) {
    await deleteDoc(doc(db, "profesores", dni));
  } else {
    let teachers = getMockItems(MOCK_STORAGE_KEYS.TEACHERS);
    teachers = teachers.filter(t => t.dni !== dni);
    saveMockItems(MOCK_STORAGE_KEYS.TEACHERS, teachers);
    await addAuditLog(usuarioEmail, "ELIMINAR", "PROFESORES", `Se eliminó el legajo del profesor (DNI: ${dni})`);
  }
};

// 5. SCHEDULE SERVICES
export const getSchedules = async () => {
  if (!isMock) {
    const snap = await getDocs(collection(db, "horarios"));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } else {
    return getMockItems(MOCK_STORAGE_KEYS.SCHEDULES);
  }
};

export const saveSchedule = async (schedule, usuarioEmail) => {
  const id = `${schedule.ano.replace("°", "")}_${schedule.division.toLowerCase()}_${schedule.turno.toLowerCase()}`;
  if (!isMock) {
    await setDoc(doc(db, "horarios", id), schedule);
  } else {
    const schedules = getMockItems(MOCK_STORAGE_KEYS.SCHEDULES);
    const idx = schedules.findIndex(s => s.ano === schedule.ano && s.division === schedule.division && s.turno === schedule.turno);
    if (idx !== -1) {
      schedules[idx] = schedule;
    } else {
      schedules.push(schedule);
    }
    saveMockItems(MOCK_STORAGE_KEYS.SCHEDULES, schedules);
    await addAuditLog(usuarioEmail, "EDITAR", "HORARIOS", `Se actualizaron los horarios de ${schedule.ano} año división ${schedule.division} - Turno ${schedule.turno}`);
  }
};

// 6. NEWS SERVICES
export const getNews = async () => {
  if (!isMock) {
    const snap = await getDocs(query(collection(db, "novedades"), orderBy("destacado", "desc"), orderBy("fecha_publicacion", "desc")));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } else {
    const news = getMockItems(MOCK_STORAGE_KEYS.NEWS);
    // Sort by destacado desc, then fecha desc
    news.sort((a, b) => {
      if (a.destacado && !b.destacado) return -1;
      if (!a.destacado && b.destacado) return 1;
      return new Date(b.fecha_publicacion) - new Date(a.fecha_publicacion);
    });
    return news;
  }
};

export const saveNews = async (item, usuarioEmail) => {
  if (!item.id) {
    item.id = `news_${Date.now()}`;
    item.fecha_publicacion = new Date().toISOString();
  }
  
  if (!isMock) {
    if (item.id.startsWith("news_")) {
      // Create with generated Firestore ID or item.id
      await setDoc(doc(db, "novedades", item.id), item);
    } else {
      await setDoc(doc(db, "novedades", item.id), item);
    }
  } else {
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
  }
};

export const deleteNews = async (id, usuarioEmail) => {
  if (!isMock) {
    await deleteDoc(doc(db, "novedades", id));
  } else {
    let news = getMockItems(MOCK_STORAGE_KEYS.NEWS);
    const item = news.find(n => n.id === id);
    news = news.filter(n => n.id !== id);
    saveMockItems(MOCK_STORAGE_KEYS.NEWS, news);
    if (item) {
      await addAuditLog(usuarioEmail, "ELIMINAR", "NOVEDADES", `Se eliminó la noticia: "${item.titulo}"`);
    }
  }
};

// 7. SEED DATABASE FUNCTION
export const seedDatabase = async (seedJson, usuarioEmail) => {
  const { estudiantes, profesores, horarios } = seedJson;
  
  if (!isMock) {
    // Seeding Real Firestore
    const batchSize = 100;
    
    // Seed Teachers
    for (let i = 0; i < profesores.length; i += batchSize) {
      const batch = writeBatch(db);
      const chunk = profesores.slice(i, i + batchSize);
      chunk.forEach(t => {
        batch.set(doc(db, "profesores", t.dni), t);
      });
      await batch.commit();
    }
    
    // Seed Students
    for (let i = 0; i < estudiantes.length; i += batchSize) {
      const batch = writeBatch(db);
      const chunk = estudiantes.slice(i, i + batchSize);
      chunk.forEach(s => {
        batch.set(doc(db, "estudiantes", s.dni), s);
      });
      await batch.commit();
    }
    
    // Seed Schedules
    const batch = writeBatch(db);
    horarios.forEach(h => {
      const id = `${h.ano.replace("°", "")}_${h.division.toLowerCase()}_${h.turno.toLowerCase()}`;
      batch.set(doc(db, "horarios", id), h);
    });
    // Create admin user role profile in Firestore
    batch.set(doc(db, "users", "admin_uid_placeholder"), { role: "admin", email: "admin@ceija.edu.ar" });
    await batch.commit();
    
    await addAuditLog(usuarioEmail, "MIGRACION", "CONFIGURACION", "Se realizó el sembrado inicial completo de datos en Firestore");
  } else {
    // Seeding Mock LocalStorage
    localStorage.setItem(MOCK_STORAGE_KEYS.STUDENTS, JSON.stringify(estudiantes));
    localStorage.setItem(MOCK_STORAGE_KEYS.TEACHERS, JSON.stringify(profesores));
    localStorage.setItem(MOCK_STORAGE_KEYS.SCHEDULES, JSON.stringify(horarios));
    await addAuditLog(usuarioEmail, "MIGRACION", "CONFIGURACION", "Se realizó el sembrado inicial de datos en base de datos local (Mock)");
  }
};

// ============================================================================
// CALENDAR CUSTOM EVENTS PERSISTENCE
// ============================================================================

export const getCustomEvents = async () => {
  if (!isMock) {
    try {
      const q = query(collection(db, "eventos_calendario"));
      const querySnapshot = await getDocs(q);
      const list = [];
      querySnapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      return list;
    } catch (e) {
      console.error("Error fetching custom events from Firestore:", e);
      return [];
    }
  } else {
    return getMockItems(MOCK_STORAGE_KEYS.CALENDAR_EVENTS);
  }
};

export const saveCustomEvent = async (event, usuarioEmail) => {
  if (!event.id) {
    event.id = `evt_${Date.now()}`;
  }
  if (!isMock) {
    await setDoc(doc(db, "eventos_calendario", event.id), event);
  } else {
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
  }
  return event;
};

export const deleteCustomEvent = async (id, usuarioEmail) => {
  if (!isMock) {
    await deleteDoc(doc(db, "eventos_calendario", id));
  } else {
    let events = getMockItems(MOCK_STORAGE_KEYS.CALENDAR_EVENTS);
    const event = events.find(e => e.id === id);
    events = events.filter(e => e.id !== id);
    saveMockItems(MOCK_STORAGE_KEYS.CALENDAR_EVENTS, events);
    if (event) {
      await addAuditLog(usuarioEmail, "ELIMINAR", "CALENDARIO", `Se eliminó el evento personalizado: "${event.titulo}"`);
    }
  }
};

// ============================================================================
// ADMIN TODO LIST PERSISTENCE
// ============================================================================

export const getAdminTasks = async () => {
  if (!isMock) {
    try {
      const q = query(collection(db, "tareas_admin"));
      const querySnapshot = await getDocs(q);
      const list = [];
      querySnapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      return list;
    } catch (e) {
      console.error("Error fetching admin tasks from Firestore:", e);
      return [];
    }
  } else {
    return getMockItems(MOCK_STORAGE_KEYS.TODO);
  }
};

export const saveAdminTask = async (task, usuarioEmail) => {
  if (!task.id) {
    task.id = `tsk_${Date.now()}`;
    task.fecha_creacion = new Date().toISOString();
  }
  if (!isMock) {
    await setDoc(doc(db, "tareas_admin", task.id), task);
  } else {
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
  }
  return task;
};

export const deleteAdminTask = async (id, usuarioEmail) => {
  if (!isMock) {
    await deleteDoc(doc(db, "tareas_admin", id));
  } else {
    let tasks = getMockItems(MOCK_STORAGE_KEYS.TODO);
    const task = tasks.find(t => t.id === id);
    tasks = tasks.filter(t => t.id !== id);
    saveMockItems(MOCK_STORAGE_KEYS.TODO, tasks);
    if (task) {
      await addAuditLog(usuarioEmail, "ELIMINAR", "TAREAS", `Se eliminó la tarea: "${task.titulo}"`);
    }
  }
};


