// src/context/DialogContext.jsx
import React, { createContext, useContext, useState } from "react";
import { AlertTriangle, Info, CheckCircle2 } from "lucide-react";

const DialogContext = createContext(null);

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return context;
};

export const DialogProvider = ({ children }) => {
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: "Confirmar acción",
    message: "",
    resolve: null
  });

  const [alertState, setAlertState] = useState({
    isOpen: false,
    title: "Atención",
    message: "",
    type: "info", // "info", "success", "error"
    resolve: null
  });

  const confirm = (message, title = "Confirmar acción") => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        title,
        message,
        resolve
      });
    });
  };

  const showAlert = (message, title = "Atención", type = "info") => {
    return new Promise((resolve) => {
      setAlertState({
        isOpen: true,
        title,
        message,
        type,
        resolve
      });
    });
  };

  const handleConfirmClose = (value) => {
    if (confirmState.resolve) {
      confirmState.resolve(value);
    }
    setConfirmState({
      isOpen: false,
      title: "Confirmar acción",
      message: "",
      resolve: null
    });
  };

  const handleAlertClose = () => {
    if (alertState.resolve) {
      alertState.resolve();
    }
    setAlertState({
      isOpen: false,
      title: "Atención",
      message: "",
      type: "info",
      resolve: null
    });
  };

  // Backdrop style
  const backdropStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(10, 15, 30, 0.75)",
    backdropFilter: "blur(8px)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1rem"
  };

  const cardStyle = {
    width: "100%",
    maxWidth: "450px",
    padding: "2rem",
    borderRadius: "var(--radius-md)",
    boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem"
  };

  return (
    <DialogContext.Provider value={{ confirm, alert: showAlert }}>
      {children}

      {/* Confirm Modal */}
      {confirmState.isOpen && (
        <div style={backdropStyle} className="animate-fade-in">
          <div className="glass-card" style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <AlertTriangle size={24} style={{ color: "var(--color-warning)", flexShrink: 0 }} />
              <h3 style={{ fontSize: "1.2rem", color: "#fff", margin: 0, fontWeight: 600 }}>
                {confirmState.title}
              </h3>
            </div>
            <p style={{ color: "var(--text-main)", fontSize: "0.95rem", lineHeight: 1.5, margin: 0 }}>
              {confirmState.message}
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
              <button 
                onClick={() => handleConfirmClose(false)} 
                className="btn btn-secondary"
                id="dialog-confirm-cancel"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleConfirmClose(true)} 
                className="btn btn-primary"
                id="dialog-confirm-accept"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {alertState.isOpen && (
        <div style={backdropStyle} className="animate-fade-in">
          <div className="glass-card" style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              {alertState.type === "success" ? (
                <CheckCircle2 size={24} style={{ color: "var(--color-success)", flexShrink: 0 }} />
              ) : (
                <Info size={24} style={{ color: "var(--primary)", flexShrink: 0 }} />
              )}
              <h3 style={{ fontSize: "1.2rem", color: "#fff", margin: 0, fontWeight: 600 }}>
                {alertState.title}
              </h3>
            </div>
            <p style={{ color: "var(--text-main)", fontSize: "0.95rem", lineHeight: 1.5, margin: 0 }}>
              {alertState.message}
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button 
                onClick={handleAlertClose} 
                className="btn btn-primary"
                id="dialog-alert-close"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
};
