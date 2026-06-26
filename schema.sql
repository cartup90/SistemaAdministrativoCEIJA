-- ESQUEMA DE BASE DE DATOS RELACIONAL (MIGRACIÓN FUTURA)
-- CEIJA N° 12 Anexo Alberdi - SisGest

-- Tabla de Estudiantes
CREATE TABLE estudiantes (
    dni VARCHAR(20) PRIMARY KEY, -- Soporta DNI temporales '99xxxxxx'
    apellido VARCHAR(100) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE,
    edad INT,
    telefono VARCHAR(50),
    domicilio VARCHAR(255),
    correo VARCHAR(100),
    ultima_escuela VARCHAR(255),
    nivel_educativo_finalizado VARCHAR(100),
    motivo_secundario TEXT,
    ano_ingreso VARCHAR(10) NOT NULL, -- '1°', '2°', '3°'
    ano_actual VARCHAR(10) NOT NULL,  -- '1°', '2°', '3°'
    division VARCHAR(20) DEFAULT 'Única',
    estado VARCHAR(50) NOT NULL DEFAULT 'Activo', -- 'Activo', 'Egresado', 'Abandonó', 'Trasladado'
    bibliorato VARCHAR(50),
    ano_apertura_legajo INT,
    dni_presentado VARCHAR(20) DEFAULT 'Pendiente', -- 'Presentado', 'Pendiente'
    cus_presentado VARCHAR(20) DEFAULT 'Pendiente', -- 'Presentado', 'Pendiente'
    certificado_primaria VARCHAR(20) DEFAULT 'Pendiente', -- 'Presentado', 'Pendiente', 'No aplica'
    pase_provisorio VARCHAR(20) DEFAULT 'Pendiente', -- 'Presentado', 'Pendiente', 'Reemplazado', 'No aplica'
    pase_definitivo VARCHAR(20) DEFAULT 'Pendiente', -- 'Presentado', 'Pendiente', 'No aplica'
    equivalencias_presentado VARCHAR(20) DEFAULT 'Pendiente', -- 'Presentado', 'Pendiente', 'No aplica'
    apto_titular BOOLEAN DEFAULT FALSE,
    observaciones TEXT
);

-- Tabla de Materias Previas / Equivalencias
CREATE TABLE materias_previas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    estudiante_dni VARCHAR(20) NOT NULL,
    nombre_materia VARCHAR(100) NOT NULL,
    ano_materia VARCHAR(10) NOT NULL, -- '1°', '2°', '3°'
    tipo VARCHAR(50) NOT NULL, -- 'Previa' o 'Equivalencia'
    estado VARCHAR(50) NOT NULL DEFAULT 'Pendiente', -- 'Pendiente', 'Aprobada', 'En proceso'
    fecha_carga DATE NOT NULL,
    observaciones TEXT,
    FOREIGN KEY (estudiante_dni) REFERENCES estudiantes(dni) ON DELETE CASCADE
);

-- Tabla de Profesores
CREATE TABLE profesores (
    dni VARCHAR(20) PRIMARY KEY,
    cuil VARCHAR(20),
    apellido VARCHAR(100) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    domicilio VARCHAR(255),
    telefono VARCHAR(50),
    correo VARCHAR(100),
    folio VARCHAR(50), -- Folio de legajo físico
    designacion VARCHAR(50) NOT NULL DEFAULT 'Titular', -- 'Titular', 'Interino', 'Suplente'
    estado VARCHAR(50) NOT NULL DEFAULT 'Activo', -- 'Activo', 'Licencia', 'Baja'
    observaciones TEXT,
    titulo_presentado VARCHAR(20) DEFAULT 'Pendiente',
    incompatibilidad_presentado VARCHAR(20) DEFAULT 'Pendiente',
    servicios_presentado VARCHAR(20) DEFAULT 'Pendiente',
    delitos_sexuales_presentado VARCHAR(20) DEFAULT 'Pendiente'
);

-- Tabla de Clases del Horario (Sincronizado)
CREATE TABLE horarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ano VARCHAR(10) NOT NULL, -- '1°', '2°', '3°'
    division VARCHAR(20) NOT NULL DEFAULT 'Única',
    turno VARCHAR(30) NOT NULL DEFAULT 'Noche',
    dia VARCHAR(20) NOT NULL, -- 'Lunes', 'Martes', ...
    hora_inicio VARCHAR(10) NOT NULL, -- '18:50'
    hora_fin VARCHAR(10) NOT NULL, -- '19:20'
    materia VARCHAR(100) NOT NULL, -- 'MATEMÁTICA', 'RECREO', etc.
    profesor_dni VARCHAR(20),
    FOREIGN KEY (profesor_dni) REFERENCES profesores(dni) ON DELETE SET NULL
);

-- Tabla de Novedades e Información Institucional
CREATE TABLE novedades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    cuerpo TEXT NOT NULL,
    fecha_publicacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    imagen_url VARCHAR(500),
    destacado BOOLEAN DEFAULT FALSE
);

-- Tabla de Auditoría (Audit Logs)
CREATE TABLE logs_auditoria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_email VARCHAR(100) NOT NULL,
    accion VARCHAR(50) NOT NULL, -- 'CREAR', 'EDITAR', 'ELIMINAR'
    modulo VARCHAR(50) NOT NULL, -- 'ESTUDIANTES', 'PROFESORES', 'HORARIOS', 'NOVEDADES'
    descripcion TEXT NOT NULL
);

-- Tabla de Eventos del Calendario
CREATE TABLE eventos_calendario (
    id VARCHAR(50) PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha_inicio VARCHAR(20) NOT NULL,
    fecha_fin VARCHAR(20) NOT NULL,
    color VARCHAR(20),
    tipo VARCHAR(100) NOT NULL
);

-- Tabla de Tareas del Administrador (To-Do List)
CREATE TABLE tareas_admin (
    id VARCHAR(50) PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    completada BOOLEAN DEFAULT FALSE,
    fecha_creacion VARCHAR(50) NOT NULL,
    fecha_vencimiento VARCHAR(50),
    prioridad VARCHAR(50) NOT NULL
);
