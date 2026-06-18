// src/db/index.js
import * as mockProvider from "./localMockProvider";
import * as firebaseProvider from "./firebaseProvider";
import * as supabaseProvider from "./supabaseProvider";

// Determine active provider based on environment variables
const dbProvider = (import.meta.env.VITE_DB_PROVIDER || "mock").toLowerCase().trim();

let activeProvider;
let isMock = false;

if (dbProvider === "supabase") {
  activeProvider = supabaseProvider;
  isMock = false;
  console.log("Sistema Institucional: Conectado a base de datos relacional (Supabase).");
} else if (dbProvider === "firebase") {
  activeProvider = firebaseProvider;
  isMock = false;
  console.log("Sistema Institucional: Conectado a base de datos NoSQL (Firebase).");
} else {
  activeProvider = mockProvider;
  isMock = true;
  console.log("Sistema Institucional: Corriendo en modo demostración local (Mock - LocalStorage).");
  // Automatically seed local storage if empty
  mockProvider.initializeMockData();
}

export { isMock };

// Export all unified service interface functions
export const login = activeProvider.login;
export const logout = activeProvider.logout;
export const onAuthChange = activeProvider.onAuthChange;
export const createUser = activeProvider.createUser;
export const changePassword = activeProvider.changePassword;

export const addAuditLog = activeProvider.addAuditLog;
export const getAuditLogs = activeProvider.getAuditLogs;

export const getStudents = activeProvider.getStudents;
export const getStudentPublicInfo = activeProvider.getStudentPublicInfo;
export const saveStudent = activeProvider.saveStudent;
export const deleteStudent = activeProvider.deleteStudent;

export const getTeachers = activeProvider.getTeachers;
export const saveTeacher = activeProvider.saveTeacher;
export const deleteTeacher = activeProvider.deleteTeacher;

export const getSchedules = activeProvider.getSchedules;
export const saveSchedule = activeProvider.saveSchedule;

export const getNews = activeProvider.getNews;
export const saveNews = activeProvider.saveNews;
export const deleteNews = activeProvider.deleteNews;

export const seedDatabase = activeProvider.seedDatabase;

export const getCustomEvents = activeProvider.getCustomEvents;
export const saveCustomEvent = activeProvider.saveCustomEvent;
export const deleteCustomEvent = activeProvider.deleteCustomEvent;

export const getAdminTasks = activeProvider.getAdminTasks;
export const saveAdminTask = activeProvider.saveAdminTask;
export const deleteAdminTask = activeProvider.deleteAdminTask;
