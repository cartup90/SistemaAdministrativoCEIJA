// src/db/firebaseProvider.js
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
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  writeBatch
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app;
let auth;
let db;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error("Firebase connection error: ", error);
}

// 1. AUTHENTICATION SERVICES
export const login = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const userUid = userCredential.user.uid;
  
  // Fix UID vs Email Role mapping bug:
  // First, check by UID document
  let userDoc = await getDoc(doc(db, "users", userUid));
  let role = "comun";
  
  if (userDoc.exists()) {
    role = userDoc.data().role;
  } else {
    // If not found by UID, search by email and associate the UID
    const q = query(collection(db, "users"), where("email", "==", email.toLowerCase().trim()));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const foundDoc = snap.docs[0];
      role = foundDoc.data().role;
      // Associate UID with the profile for next time
      await setDoc(doc(db, "users", userUid), {
        email: email.toLowerCase().trim(),
        role: role
      });
    }
  }
  
  return {
    uid: userUid,
    email: userCredential.user.email,
    role: role
  };
};

export const logout = async () => {
  await signOut(auth);
};

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      let role = "comun";
      try {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
          role = userDoc.data().role;
        } else {
          const q = query(collection(db, "users"), where("email", "==", firebaseUser.email.toLowerCase().trim()));
          const snap = await getDocs(q);
          if (!snap.empty) {
            role = snap.docs[0].data().role;
            await setDoc(doc(db, "users", firebaseUser.uid), {
              email: firebaseUser.email.toLowerCase().trim(),
              role: role
            });
          }
        }
      } catch (err) {
        console.error("Error resolving user role: ", err);
      }
      callback({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        role: role
      });
    } else {
      callback(null);
    }
  });
};

export const createUser = async (email, password, role, usuarioEmail) => {
  // Use a temporary secondary Firebase App to create user without signing out the current admin
  const secondaryAppName = `SecondaryApp_${Date.now()}`;
  const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);
  
  try {
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email.toLowerCase().trim(), password);
    const newUid = userCredential.user.uid;
    
    // Save role in Firestore mapped by new user's UID
    await setDoc(doc(db, "users", newUid), {
      email: email.toLowerCase().trim(),
      role: role
    });
    
    // Cleanup secondary app auth
    await signOut(secondaryAuth);
    if (typeof secondaryApp.delete === "function") {
      await secondaryApp.delete();
    }
  } catch (error) {
    console.error("Error creating user in Firebase: ", error);
    throw error;
  }
  
  await addAuditLog(usuarioEmail, "CREAR_USUARIO", "CONFIGURACION", `Se registró el usuario ${email} con rol ${role}`);
};

export const changePassword = async (currentPassword, newPassword) => {
  const currentUser = auth.currentUser;
  if (currentUser) {
    await updatePassword(currentUser, newPassword);
  } else {
    throw new Error("No hay usuario autenticado.");
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
  try {
    await addDoc(collection(db, "logs_auditoria"), logEntry);
  } catch (e) {
    console.error("Error writing audit log:", e);
  }
};

export const getAuditLogs = async () => {
  const q = query(collection(db, "logs_auditoria"), orderBy("timestamp", "desc"), limit(200));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// 3. STUDENT SERVICES
export const getStudents = async (filters = {}) => {
  let q = collection(db, "estudiantes");
  const snap = await getDocs(q);
  const students = snap.docs.map(doc => ({ ...doc.data() }));

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
  const docRef = doc(db, "estudiantes", dni);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const student = docSnap.data();
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

  const docRef = doc(db, "estudiantes", student.dni);
  const docSnap = await getDoc(docRef);
  
  await setDoc(docRef, student);
  
  if (docSnap.exists()) {
    await addAuditLog(usuarioEmail, "EDITAR", "ESTUDIANTES", `Se modificó el legajo del estudiante ${student.apellido}, ${student.nombre} (DNI: ${student.dni})`);
  } else {
    await addAuditLog(usuarioEmail, "CREAR", "ESTUDIANTES", `Se creó el legajo del estudiante ${student.apellido}, ${student.nombre} (DNI: ${student.dni})`);
  }
};

export const deleteStudent = async (dni, nameString, usuarioEmail) => {
  await deleteDoc(doc(db, "estudiantes", dni));
  await addAuditLog(usuarioEmail, "ELIMINAR", "ESTUDIANTES", `Se eliminó el legajo del estudiante (DNI: ${dni})`);
};

// 4. TEACHER SERVICES
export const getTeachers = async (filters = {}) => {
  const snap = await getDocs(collection(db, "profesores"));
  const teachers = snap.docs.map(doc => ({ ...doc.data() }));
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
  const docRef = doc(db, "profesores", teacher.dni);
  const docSnap = await getDoc(docRef);
  await setDoc(docRef, teacher);
  
  if (docSnap.exists()) {
    await addAuditLog(usuarioEmail, "EDITAR", "PROFESORES", `Se modificó el legajo del docente ${teacher.apellido}, ${teacher.nombre} (DNI: ${teacher.dni})`);
  } else {
    await addAuditLog(usuarioEmail, "CREAR", "PROFESORES", `Se creó el legajo del docente ${teacher.apellido}, ${teacher.nombre} (DNI: ${teacher.dni})`);
  }
};

export const deleteTeacher = async (dni, usuarioEmail) => {
  await deleteDoc(doc(db, "profesores", dni));
  await addAuditLog(usuarioEmail, "ELIMINAR", "PROFESORES", `Se eliminó el legajo del profesor (DNI: ${dni})`);
};

// 5. SCHEDULE SERVICES
export const getSchedules = async () => {
  const snap = await getDocs(collection(db, "horarios"));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const saveSchedule = async (schedule, usuarioEmail) => {
  const id = `${schedule.ano.replace("°", "")}_${schedule.division.toLowerCase()}_${schedule.turno.toLowerCase()}`;
  await setDoc(doc(db, "horarios", id), schedule);
  await addAuditLog(usuarioEmail, "EDITAR", "HORARIOS", `Se actualizaron los horarios de ${schedule.ano} año división ${schedule.division} - Turno ${schedule.turno}`);
};

// 6. NEWS SERVICES
export const getNews = async () => {
  const snap = await getDocs(query(collection(db, "novedades"), orderBy("destacado", "desc"), orderBy("fecha_publicacion", "desc")));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const saveNews = async (item, usuarioEmail) => {
  if (!item.id) {
    item.id = `news_${Date.now()}`;
    item.fecha_publicacion = new Date().toISOString();
  }
  
  const docRef = doc(db, "novedades", item.id);
  const docSnap = await getDoc(docRef);
  await setDoc(docRef, item);
  
  if (docSnap.exists()) {
    await addAuditLog(usuarioEmail, "EDITAR", "NOVEDADES", `Se editó la noticia: "${item.titulo}"`);
  } else {
    await addAuditLog(usuarioEmail, "CREAR", "NOVEDADES", `Se publicó una nueva noticia: "${item.titulo}"`);
  }
};

export const deleteNews = async (id, usuarioEmail) => {
  const docRef = doc(db, "novedades", id);
  const docSnap = await getDoc(docRef);
  const title = docSnap.exists() ? docSnap.data().titulo : id;
  await deleteDoc(docRef);
  await addAuditLog(usuarioEmail, "ELIMINAR", "NOVEDADES", `Se eliminó la noticia: "${title}"`);
};

// 7. SEED DATABASE FUNCTION
export const seedDatabase = async (seedJson, usuarioEmail) => {
  const { estudiantes, profesores, horarios } = seedJson;
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
  await batch.commit();
  
  await addAuditLog(usuarioEmail, "MIGRACION", "CONFIGURACION", "Se realizó el sembrado inicial completo de datos en Firestore");
};

// 8. CALENDAR EVENTS
export const getCustomEvents = async () => {
  const q = query(collection(db, "eventos_calendario"));
  const querySnapshot = await getDocs(q);
  const list = [];
  querySnapshot.forEach(doc => {
    list.push({ id: doc.id, ...doc.data() });
  });
  return list;
};

export const saveCustomEvent = async (event, usuarioEmail) => {
  if (!event.id) {
    event.id = `evt_${Date.now()}`;
  }
  const docRef = doc(db, "eventos_calendario", event.id);
  const docSnap = await getDoc(docRef);
  await setDoc(docRef, event);
  
  if (docSnap.exists()) {
    await addAuditLog(usuarioEmail, "EDITAR", "CALENDARIO", `Se editó el evento personalizado: "${event.titulo}"`);
  } else {
    await addAuditLog(usuarioEmail, "CREAR", "CALENDARIO", `Se creó el evento personalizado: "${event.titulo}"`);
  }
  return event;
};

export const deleteCustomEvent = async (id, usuarioEmail) => {
  const docRef = doc(db, "eventos_calendario", id);
  const docSnap = await getDoc(docRef);
  const title = docSnap.exists() ? docSnap.data().titulo : id;
  await deleteDoc(docRef);
  await addAuditLog(usuarioEmail, "ELIMINAR", "CALENDARIO", `Se eliminó el evento personalizado: "${title}"`);
};

// 9. TODO LIST
export const getAdminTasks = async () => {
  const q = query(collection(db, "tareas_admin"));
  const querySnapshot = await getDocs(q);
  const list = [];
  querySnapshot.forEach(doc => {
    list.push({ id: doc.id, ...doc.data() });
  });
  return list;
};

export const saveAdminTask = async (task, usuarioEmail) => {
  if (!task.id) {
    task.id = `tsk_${Date.now()}`;
    task.fecha_creacion = new Date().toISOString();
  }
  const docRef = doc(db, "tareas_admin", task.id);
  const docSnap = await getDoc(docRef);
  await setDoc(docRef, task);
  
  if (docSnap.exists()) {
    await addAuditLog(usuarioEmail, "EDITAR", "TAREAS", `Se modificó la tarea: "${task.titulo}"`);
  } else {
    await addAuditLog(usuarioEmail, "CREAR", "TAREAS", `Se creó la tarea: "${task.titulo}"`);
  }
  return task;
};

export const deleteAdminTask = async (id, usuarioEmail) => {
  const docRef = doc(db, "tareas_admin", id);
  const docSnap = await getDoc(docRef);
  const title = docSnap.exists() ? docSnap.data().titulo : id;
  await deleteDoc(docRef);
  await addAuditLog(usuarioEmail, "ELIMINAR", "TAREAS", `Se eliminó la tarea: "${title}"`);
};
