// src/components/ScienceFairModule.jsx
import React, { useState, useRef } from "react";
import { FlaskConical, Play, ChevronLeft, ChevronRight, Sparkles, Factory, Utensils, Mic } from "lucide-react";

// Import science fair videos
import videoSalsa from "../assets/Videos Feria de ciencias/Estabre Esmeralda - Salsa de tomate.mp4";
import videoPizza from "../assets/Videos Feria de ciencias/Lorena y Brisa Perez - Pizza artesanal.mp4";
import videoAlfajores from "../assets/Videos Feria de ciencias/Mariana Vietti - Alfajores de maizena.mp4";
import videoEntrevista from "../assets/Videos Feria de ciencias/Sharon,Yanina,Milagros - Entrevista a consumidores y comerciantes.mp4";
import videoPanDeMolde from "../assets/Videos Feria de ciencias/Pan de molde industrial.mp4";

// Import science fair audios
import audioComerciante from "../assets/Videos Feria de ciencias/Audio Entrevista a comerciante - Agos y cande.ogg";
import audioConsumidor from "../assets/Videos Feria de ciencias/Audio entrevista a Consumidor - Agos y Cande.ogg";

const videos = [
  {
    id: 1,
    src: videoPizza,
    author: "Lorena y Brisa Pérez",
    title: "Pizza Artesanal",
    description: "Elaboración y comparación de pizza artesanal frente a la industrial, analizando ingredientes, proceso de producción y calidad nutricional.",
    type: "artesanal",
    emoji: "🍕",
  },
  {
    id: 2,
    src: videoSalsa,
    author: "Estabre Esmeralda",
    title: "Salsa de Tomate",
    description: "Investigación sobre la producción artesanal de salsa de tomate y su comparación con las versiones industriales disponibles en el mercado.",
    type: "artesanal",
    emoji: "🍅",
  },
  {
    id: 3,
    src: videoAlfajores,
    author: "Mariana Vietti",
    title: "Alfajores de Maicena",
    description: "Análisis comparativo entre la elaboración casera de alfajores de maicena y los productos industriales, considerando sabor, costo y procesos.",
    type: "artesanal",
    emoji: "🍪",
  },
  {
    id: 4,
    src: videoEntrevista,
    author: "Sharon, Yanina y Milagros",
    title: "Entrevista a Consumidores y Comerciantes",
    description: "Trabajo de campo con entrevistas a consumidores y comerciantes del barrio sobre sus preferencias y percepciones respecto a los productos artesanales e industriales.",
    type: "investigacion",
    emoji: "🎤",
  },
  {
    id: 5,
    src: videoPanDeMolde,
    author: "Cande y Agos",
    title: "Pan de Molde",
    description: "Comparación entre el pan de molde artesanal y el industrial: análisis de ingredientes, conservantes, tiempo de elaboración y diferencias en sabor y textura.",
    type: "artesanal",
    emoji: "🍞",
  },
];

const audios = [
  {
    id: 1,
    src: audioComerciante,
    author: "Agos y Cande",
    title: "Entrevista a Comerciante",
    description: "Audio de entrevista realizada a un comerciante del barrio sobre sus preferencias y conocimientos acerca de los productos artesanales vs. industriales.",
    emoji: "🏪",
  },
  {
    id: 2,
    src: audioConsumidor,
    author: "Agos y Cande",
    title: "Entrevista a Consumidor",
    description: "Audio de entrevista realizada a un consumidor, explorando sus hábitos de compra y opiniones sobre la calidad de los productos artesanales frente a los industriales.",
    emoji: "🛒",
  },
];

export default function ScienceFairModule() {
  const [activeVideo, setActiveVideo] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);

  const current = videos[activeVideo];

  const handleVideoClick = (idx) => {
    if (idx === activeVideo) return;
    setActiveVideo(idx);
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.load();
    }
  };

  const handlePrev = () => {
    const prev = (activeVideo - 1 + videos.length) % videos.length;
    handleVideoClick(prev);
  };

  const handleNext = () => {
    const next = (activeVideo + 1) % videos.length;
    handleVideoClick(next);
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>

      {/* Section Header */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(139,38,53,0.08) 0%, rgba(244,180,26,0.06) 100%)",
          border: "1px solid var(--border-glass)",
          borderRadius: "var(--radius-lg)",
          padding: "2rem 2.5rem",
          display: "flex",
          alignItems: "flex-start",
          gap: "1.5rem",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--color-ladrillo), var(--color-ocre))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 4px 16px rgba(139,38,53,0.25)",
          }}
        >
          <FlaskConical size={28} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: "260px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
            <h2
              style={{
                fontFamily: "var(--font-family-title)",
                fontSize: "clamp(1.4rem, 2.5vw, 1.9rem)",
                fontWeight: 800,
                color: "var(--text-main)",
                lineHeight: 1.15,
              }}
            >
              Feria de Ciencias 2026
            </h2>
            <span
              style={{
                background: "rgba(139,38,53,0.12)",
                color: "var(--color-ladrillo)",
                fontSize: "0.7rem",
                fontWeight: 700,
                padding: "0.2rem 0.6rem",
                borderRadius: "var(--radius-sm)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              CEIJA Nº12
            </span>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.65, maxWidth: "680px" }}>
            Estos videos y audios fueron producidos por los propios estudiantes en el marco de la{" "}
            <strong style={{ color: "var(--color-ladrillo)" }}>Feria de Ciencias</strong>, como parte de un proyecto de
            investigación que compara{" "}
            <strong style={{ color: "var(--color-ocre)" }}>lo artesanal con lo industrial</strong>. Cada producción refleja
            el trabajo, la creatividad y el pensamiento crítico de nuestra comunidad educativa.
          </p>
          <div style={{ display: "flex", gap: "1.25rem", marginTop: "1rem", flexWrap: "wrap" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                background: "rgba(99,102,241,0.07)",
                padding: "0.35rem 0.75rem",
                borderRadius: "var(--radius-sm)",
                border: "1px solid rgba(99,102,241,0.12)",
              }}
            >
              <Utensils size={14} style={{ color: "var(--primary)" }} />
              <span>Producción artesanal</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                background: "rgba(244,180,26,0.07)",
                padding: "0.35rem 0.75rem",
                borderRadius: "var(--radius-sm)",
                border: "1px solid rgba(244,180,26,0.15)",
              }}
            >
              <Factory size={14} style={{ color: "var(--color-ocre)" }} />
              <span>vs. Industrial</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                background: "rgba(139,38,53,0.06)",
                padding: "0.35rem 0.75rem",
                borderRadius: "var(--radius-sm)",
                border: "1px solid rgba(139,38,53,0.1)",
              }}
            >
              <Sparkles size={14} style={{ color: "var(--color-ladrillo)" }} />
              <span>{videos.length} videos + {audios.length} audios de campo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Video Player */}
      <div
        className="glass-card"
        style={{
          overflow: "hidden",
          padding: 0,
          border: "2px solid var(--color-ladrillo)",
        }}
      >
        {/* Video element */}
        <div
          style={{
            position: "relative",
            background: "#000",
            aspectRatio: "16/9",
            maxHeight: "520px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <video
            ref={videoRef}
            key={current.src}
            src={current.src}
            style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
            controls
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          />

          {/* Prev Arrow */}
          <button
            onClick={handlePrev}
            title="Video anterior"
            style={{
              position: "absolute",
              left: "0.75rem",
              top: "50%",
              transform: "translateY(-50%)",
              background: "rgba(0,0,0,0.55)",
              border: "none",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#fff",
              transition: "background 0.2s",
              zIndex: 2,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(139,38,53,0.85)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.55)")}
          >
            <ChevronLeft size={22} />
          </button>

          {/* Next Arrow */}
          <button
            onClick={handleNext}
            title="Video siguiente"
            style={{
              position: "absolute",
              right: "0.75rem",
              top: "50%",
              transform: "translateY(-50%)",
              background: "rgba(0,0,0,0.55)",
              border: "none",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#fff",
              transition: "background 0.2s",
              zIndex: 2,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(139,38,53,0.85)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.55)")}
          >
            <ChevronRight size={22} />
          </button>
        </div>

        {/* Current Video Info */}
        <div style={{ padding: "1.5rem 2rem", borderTop: "1px solid var(--border-glass)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "220px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                <span style={{ fontSize: "1.5rem" }}>{current.emoji}</span>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-main)" }}>{current.title}</h3>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--color-ladrillo)", fontWeight: 600, marginBottom: "0.5rem" }}>
                por {current.author}
              </p>
              <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.6 }}>{current.description}</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem", flexShrink: 0 }}>
              <span
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  padding: "0.3rem 0.7rem",
                  borderRadius: "var(--radius-sm)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  background: current.type === "artesanal" ? "rgba(99,102,241,0.1)" : "rgba(244,180,26,0.12)",
                  color: current.type === "artesanal" ? "var(--primary)" : "var(--color-ocre)",
                  border: `1px solid ${current.type === "artesanal" ? "rgba(99,102,241,0.18)" : "rgba(244,180,26,0.2)"}`,
                }}
              >
                {current.type === "artesanal" ? "🧑‍🍳 Producción artesanal" : "🎤 Investigación de campo"}
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-inactive)" }}>
                {activeVideo + 1} / {videos.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Video Thumbnail Gallery */}
      <div>
        <h3
          style={{
            fontSize: "1.05rem",
            fontWeight: 700,
            color: "var(--text-main)",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Play size={16} style={{ color: "var(--color-ladrillo)" }} />
          Todas las producciones
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
            gap: "1rem",
          }}
        >
          {videos.map((video, idx) => (
            <button
              key={video.id}
              onClick={() => handleVideoClick(idx)}
              style={{
                all: "unset",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                border: `2px solid ${activeVideo === idx ? "var(--color-ladrillo)" : "var(--border-glass)"}`,
                background: activeVideo === idx ? "rgba(139,38,53,0.05)" : "var(--bg-secondary)",
                transition: "border-color 0.2s, transform 0.18s, box-shadow 0.2s",
                boxShadow: activeVideo === idx
                  ? "0 0 0 3px rgba(139,38,53,0.15), 0 4px 12px rgba(0,0,0,0.12)"
                  : "0 2px 6px rgba(0,0,0,0.06)",
                transform: activeVideo === idx ? "translateY(-2px)" : "none",
              }}
              onMouseEnter={(e) => {
                if (activeVideo !== idx) {
                  e.currentTarget.style.borderColor = "var(--primary)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }
              }}
              onMouseLeave={(e) => {
                if (activeVideo !== idx) {
                  e.currentTarget.style.borderColor = "var(--border-glass)";
                  e.currentTarget.style.transform = "none";
                }
              }}
            >
              {/* Thumbnail area with emoji */}
              <div
                style={{
                  height: "110px",
                  background: activeVideo === idx
                    ? "linear-gradient(135deg, rgba(139,38,53,0.15), rgba(244,180,26,0.1))"
                    : "linear-gradient(135deg, rgba(30,30,40,0.85), rgba(50,50,70,0.7))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2.8rem",
                  position: "relative",
                }}
              >
                {video.emoji}
                {activeVideo === idx && (
                  <div
                    style={{
                      position: "absolute",
                      top: "0.5rem",
                      right: "0.5rem",
                      background: "var(--color-ladrillo)",
                      borderRadius: "50%",
                      width: "22px",
                      height: "22px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Play size={11} color="#fff" fill="#fff" />
                  </div>
                )}
              </div>

              {/* Video info */}
              <div style={{ padding: "0.75rem 1rem", flex: 1, textAlign: "left" }}>
                <p
                  style={{
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    color: "var(--text-main)",
                    marginBottom: "0.2rem",
                    lineHeight: 1.3,
                  }}
                >
                  {video.emoji} {video.title}
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--color-ladrillo)", fontWeight: 600 }}>
                  {video.author}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Audio Interviews Section */}
      <div>
        <h3
          style={{
            fontSize: "1.05rem",
            fontWeight: 700,
            color: "var(--text-main)",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Mic size={16} style={{ color: "var(--color-ocre)" }} />
          Audios de Entrevistas — Agos y Cande
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {audios.map((audio) => (
            <div
              key={audio.id}
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-glass)",
                borderLeft: "4px solid var(--color-ocre)",
                borderRadius: "var(--radius-lg)",
                padding: "1.25rem 1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.85rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", flexWrap: "wrap" }}>
                <span style={{ fontSize: "1.8rem", flexShrink: 0 }}>{audio.emoji}</span>
                <div style={{ flex: 1, minWidth: "180px" }}>
                  <p style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.15rem" }}>
                    {audio.title}
                  </p>
                  <p style={{ fontSize: "0.78rem", color: "var(--color-ocre)", fontWeight: 600, marginBottom: "0.35rem" }}>
                    por {audio.author}
                  </p>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.55 }}>
                    {audio.description}
                  </p>
                </div>
              </div>
              <audio
                src={audio.src}
                controls
                style={{
                  width: "100%",
                  height: "40px",
                  borderRadius: "var(--radius-sm)",
                  accentColor: "var(--color-ocre)",
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Project Footer Note */}
      <div
        style={{
          background: "rgba(244,180,26,0.04)",
          border: "1px dashed rgba(244,180,26,0.25)",
          borderRadius: "var(--radius-lg)",
          padding: "1.25rem 1.75rem",
          display: "flex",
          gap: "0.75rem",
          alignItems: "flex-start",
        }}
      >
        <Sparkles size={18} style={{ color: "var(--color-ocre)", flexShrink: 0, marginTop: "0.1rem" }} />
        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.65 }}>
          <strong style={{ color: "var(--text-main)" }}>
            Proyecto Feria de Ciencias · CEIJA Nº12 Alberdi · 2026.
          </strong>{" "}
          Estas producciones son el resultado del trabajo de nuestros estudiantes en el marco de la Feria de Ciencias
          institucional. El proyecto explora la comparación entre métodos de producción artesanales e industriales en
          alimentos de consumo cotidiano, integrando investigación de campo, experimentación y comunicación científica.
        </p>
      </div>
    </div>
  );
}
