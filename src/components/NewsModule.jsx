// src/components/NewsModule.jsx
import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Pin, 
  X, 
  Save, 
  Newspaper,
  Calendar,
  Image as ImageIcon
} from "lucide-react";
import { getNews, saveNews, deleteNews } from "../firebase";
import { useDialog } from "../context/DialogContext";

export default function NewsModule({ user }) {
  const isAdmin = user && user.role === "admin";
  const { confirm, alert } = useDialog();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // Form State
  const [formValues, setFormValues] = useState({
    titulo: "",
    cuerpo: "",
    imagen_url: "",
    destacado: false
  });
  const [formError, setFormError] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getNews();
      setNews(data);
    } catch (e) {
      console.error("Error loading news:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormValues({
      titulo: "",
      cuerpo: "",
      imagen_url: "",
      destacado: false
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormValues({
      titulo: item.titulo,
      cuerpo: item.cuerpo,
      imagen_url: item.imagen_url || "",
      destacado: !!item.destacado
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formValues.titulo.trim() || !formValues.cuerpo.trim()) {
      setFormError("Por favor complete el título y el cuerpo de la publicación.");
      return;
    }

    const payload = {
      ...formValues,
      id: editingItem ? editingItem.id : undefined,
      fecha_publicacion: editingItem ? editingItem.fecha_publicacion : new Date().toISOString()
    };

    try {
      await saveNews(payload, user.email);
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      await alert("Error al guardar la publicación.", "Error de Guardado");
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirm(
      "¿Está seguro de que desea eliminar permanentemente esta publicación?",
      "Confirmar Eliminación"
    );
    if (isConfirmed) {
      try {
        await deleteNews(id, user.email);
        loadData();
      } catch (err) {
        console.error(err);
        await alert("Error al eliminar.", "Error de Eliminación");
      }
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }) + " hs";
    } catch {
      return isoString;
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Title */}
      <div className="flex-between" style={{ flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", color: "#fff", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Newspaper size={28} style={{ color: "var(--primary)" }} />
            <span>Novedades e Información Institucional</span>
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Cartelera digital de noticias, comunicados oficiales y eventos de la comunidad educativa.
          </p>
        </div>
        
        {isAdmin && (
          <button onClick={handleOpenAdd} className="btn btn-primary">
            <Plus size={16} />
            <span>Publicar Noticia</span>
          </button>
        )}
      </div>

      {/* News Stream */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>Cargando novedades...</div>
      ) : news.length === 0 ? (
        <div className="glass-card" style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
          No hay publicaciones vigentes en la cartelera.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {news.map((item) => (
            <article 
              key={item.id} 
              className="glass-card animate-fade-in"
              style={{
                padding: "2rem",
                position: "relative",
                borderLeft: item.destacado ? "4px solid var(--primary)" : "1px solid var(--border-glass)",
                display: "flex",
                flexDirection: "column",
                gap: "1rem"
              }}
            >
              {/* Highlight Pin indicator */}
              {item.destacado && (
                <div 
                  style={{
                    position: "absolute",
                    top: "1.5rem",
                    right: "1.5rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    color: "var(--primary)",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    textTransform: "uppercase"
                  }}
                >
                  <Pin size={12} style={{ transform: "rotate(45deg)" }} />
                  <span>Destacada</span>
                </div>
              )}

              {/* Title & Metadata */}
              <div style={{ paddingRight: item.destacado ? "6rem" : "0" }}>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                  <span className="flower-category-tag">
                    <span className="flower-icon-dot" />
                    <span>
                      {item.titulo.toLowerCase().includes("clase") || item.titulo.toLowerCase().includes("desinfección") || item.titulo.toLowerCase().includes("suspensión") ? "Académico" :
                       item.titulo.toLowerCase().includes("taller") || item.titulo.toLowerCase().includes("inscrip") ? "Taller" :
                       item.titulo.toLowerCase().includes("acto") || item.titulo.toLowerCase().includes("patria") ? "Acto Escolar" :
                       item.titulo.toLowerCase().includes("maternal") || item.titulo.toLowerCase().includes("sala") ? "Espacio Maternal" :
                       "Institucional"}
                    </span>
                  </span>
                </div>
                <h2 style={{ fontSize: "1.5rem", color: "#fff", fontWeight: 700, marginBottom: "0.35rem" }}>
                  {item.titulo}
                </h2>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                  <Calendar size={14} />
                  <span>Publicado el {formatDate(item.fecha_publicacion)}</span>
                </div>
              </div>

              {/* Article Content & Image */}
              <div 
                style={{
                  display: "flex",
                  gap: "1.5rem",
                  flexDirection: "row",
                  alignItems: "flex-start"
                }}
                className="news-content-block"
              >
                {/* Responsive CSS helper */}
                <style dangerouslySetInnerHTML={{__html: `
                  @media (max-width: 640px) {
                    .news-content-block {
                      flex-direction: column !important;
                    }
                    .news-img {
                      width: 100% !important;
                      max-height: 200px !important;
                    }
                  }
                `}} />

                {item.imagen_url && (
                  <img 
                    src={item.imagen_url} 
                    alt={item.titulo} 
                    className="news-img"
                    style={{
                      width: "180px",
                      height: "120px",
                      objectFit: "cover",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-glass)",
                      flexShrink: 0
                    }}
                    onError={(e) => {
                      e.target.style.display = "none"; // hide if broken url
                    }}
                  />
                )}

                <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6, whiteSpace: "pre-line", flexGrow: 1 }}>
                  {item.cuerpo}
                </p>
              </div>

              {/* Admin Actions */}
              {isAdmin && (
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1rem", marginTop: "0.5rem" }}>
                  <button 
                    onClick={() => handleOpenEdit(item)}
                    className="btn btn-secondary"
                    style={{ padding: "0.45rem 0.85rem", fontSize: "0.85rem" }}
                  >
                    <Edit3 size={14} />
                    <span>Editar</span>
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="btn btn-danger"
                    style={{ padding: "0.45rem 0.85rem", fontSize: "0.85rem" }}
                  >
                    <Trash2 size={14} />
                    <span>Eliminar</span>
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {/* =======================================================================
          NEWS PUBLISHING MODAL (Admin only)
          ======================================================================= */}
      {isModalOpen && (
        <div style={modalBackdropStyle}>
          <div className="glass-card animate-fade-in" style={modalContentStyle(550)}>
            <div className="flex-between" style={{ borderBottom: "1px solid var(--border-glass)", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.3rem", color: "#fff" }}>
                {editingItem ? "Modificar Publicación" : "Publicar Noticia Institucional"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={closeButtonStyle}>
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="badge-error" style={{ padding: "0.75rem", borderRadius: "var(--radius-sm)", display: "flex", gap: "0.5rem", fontSize: "0.85rem", marginBottom: "1rem", textTransform: "none", letterSpacing: "normal" }}>
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="news_form_title">Título de la Noticia *</label>
                <input 
                  id="news_form_title"
                  type="text" 
                  className="form-control"
                  placeholder="Ej. Suspensión de clases por desinfección"
                  value={formValues.titulo}
                  onChange={(e) => setFormValues(prev => ({ ...prev, titulo: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="news_form_img">URL de Imagen Ilustrativa (Opcional)</label>
                <input 
                  id="news_form_img"
                  type="text" 
                  className="form-control"
                  placeholder="https://ejemplo.com/imagen.jpg"
                  value={formValues.imagen_url}
                  onChange={(e) => setFormValues(prev => ({ ...prev, imagen_url: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="news_form_body">Cuerpo de la Publicación *</label>
                <textarea 
                  id="news_form_body"
                  className="form-control"
                  placeholder="Escriba los detalles del comunicado aquí..."
                  rows={6}
                  value={formValues.cuerpo}
                  onChange={(e) => setFormValues(prev => ({ ...prev, cuerpo: e.target.value }))}
                  style={{ resize: "none", lineHeight: 1.5 }}
                />
              </div>

              <div className="form-group" style={{ flexDirection: "row", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                <input 
                  id="news_form_pinned"
                  type="checkbox" 
                  checked={formValues.destacado}
                  onChange={(e) => setFormValues(prev => ({ ...prev, destacado: e.target.checked }))}
                  style={{ width: "16px", height: "16px", accentColor: "var(--primary)" }}
                />
                <label className="form-label" style={{ cursor: "pointer", userSelect: "none", color: "#fff" }} htmlFor="news_form_pinned">
                  Destacar publicación (fijar permanentemente arriba)
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} />
                  <span>Publicar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Styling definitions (shared)
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
