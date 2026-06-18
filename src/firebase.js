// src/firebase.js
// Bridge file: Re-exports all database services from the database abstraction layer.
// This preserves all existing import statements in components without modifications.

export { 
  isMock,
  login,
  logout,
  onAuthChange,
  createUser,
  changePassword,
  addAuditLog,
  getAuditLogs,
  getStudents,
  getStudentPublicInfo,
  saveStudent,
  deleteStudent,
  getTeachers,
  saveTeacher,
  deleteTeacher,
  getSchedules,
  saveSchedule,
  getNews,
  saveNews,
  deleteNews,
  seedDatabase,
  getCustomEvents,
  saveCustomEvent,
  deleteCustomEvent,
  getAdminTasks,
  saveAdminTask,
  deleteAdminTask
} from "./db/index.js";
