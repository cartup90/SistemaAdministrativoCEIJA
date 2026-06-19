# SisGest — Sistema de Gestión Administrativa (CEIJA N° 12 Anexo Alberdi)

Bienvenido a la documentación oficial de **SisGest (Sistema de Gestión)**, la plataforma web diseñada para la administración escolar, control de legajos físicos, seguimiento de materias previas, grillas horarias y auditoría general del CEIJA N° 12 Anexo Alberdi.

Este sistema ha sido diseñado con un enfoque híbrido y altamente configurable para adaptarse tanto a bases de datos relacionales como NoSQL y entornos sin conexión (mock).

---

## Índice
1. [Descripción General del Sistema](#1-descripción-general-del-sistema)
2. [Funcionalidades y Módulos del Portal](#2-funcionalidades-y-módulos-del-portal)
3. [Apartado Técnico y Arquitectura](#3-apartado-técnico-y-arquitectura)
4. [Justificación Tecnológica (Frameworks e Infraestructura)](#4-justificación-tecnológica-frameworks-e-infraestructura)
5. [Gestión de Datos y Multiproveedor](#5-gestión-de-datos-y-multiproveedor)
6. [Instalación y Despliegue](#6-instalación-y-despliegue)

---

## 1. Descripción General del Sistema

SisGest es una Single Page Application (SPA) responsiva y moderna dividida en dos grandes pilares de acceso:

1. **Portal Público de Consulta:**
   * **Objetivo:** Permitir a la comunidad escolar y alumnos verificar su estado administrativo sin credenciales de acceso complejas.
   * **Funcionamiento:** Ingresando el DNI del alumno, se consulta en tiempo real si el legajo está completo, si cumple la condición de *Apto Titular*, cuáles son sus materias previas pendientes de aprobación, novedades institucionales, horarios de cursado y eventos escolares del mes actual.
   
2. **Panel de Control Administrativo (Gestión Privada):**
   * **Objetivo:** Permitir a directivos y auxiliares la digitalización e ingreso de legajos, horarios, profesores y novedades.
   * **Niveles de Acceso (RBAC):**
     * **Administrador (`admin`):** Acceso total de lectura y escritura (CRUD) en todas las herramientas del sistema, creación de nuevos usuarios y auditoría profunda de logs.
     * **Usuario Común (`comun`):** Acceso de lectura en la mayoría de secciones, con permisos de escritura limitados a actividades de apoyo.

---

## 2. Funcionalidades y Módulos del Portal

El panel administrativo privado cuenta con las siguientes herramientas desarrolladas de forma modular en React:

* **Estudiantes (`StudentModule.jsx`):** 
  * Registro integral de datos personales (DNI, nombres, datos de contacto, última escuela, etc.).
  * **Control de Documentos en Papel:** Monitorea la presentación física de requisitos clave (DNI, C.U.S., Certificado Primaria, Pase Provisorio, Pase Definitivo).
  * **Regla de Apto Titular:** Algoritmo en tiempo real que evalúa si el alumno está habilitado como titular:
    $$\text{Apto Titular} = \text{DNI Presentado} \land \text{CUS Presentado} \land (\text{Certificado Primaria Presentado} \lor \text{Pase Definitivo Presentado})$$
  * **Materias Previas y Equivalencias:** Gestor dinámico para añadir asignaturas pendientes con estados (Pendiente, Aprobada) y fechas de examen.
* **Profesores (`TeacherModule.jsx`):**
  * Control del legajo físico de docentes, incluyendo folios de archivo y datos de contacto.
  * Seguimiento de documentación laboral anual (Título habilitante, Incompatibilidad horaria, Constancia de servicios y Antecedentes de delitos sexuales).
  * Mapeo y asignación de materias dictadas por año.
* **Horarios (`ScheduleModule.jsx`):**
  * Grilla horaria interactiva organizada de Lunes a Viernes en el turno vespertino (18:50 hs a 22:30 hs) para los tres años (1°, 2° y 3°).
  * Asignación dinámica de profesores y materias a los diferentes bloques horarios.
* **Cartelera de Novedades (`NewsModule.jsx`):**
  * Administrador de publicaciones. Permite destacar noticias en la cabecera del portal y asociar imágenes informativas.
* **Calendario Escolar (`CalendarModule.jsx`):**
  * Agenda visual interactiva mensual para feriados, jornadas docentes, mesas de examen y eventos personalizados de la sede Alberdi.
* **Lista de Tareas (`TodoModule.jsx`):**
  * Organizador diario administrativo estilo Kanban con prioridades (Alta, Media, Baja) y fechas de vencimiento.
* **Logs de Auditoría (`ConfigModule.jsx`):**
  * Registro indeleble e histórico que detalla: fecha/hora exacta, correo del usuario responsable, acción realizada (CREAR, EDITAR, ELIMINAR, MIGRACIÓN), módulo afectado y descripción detallada del cambio realizado.

---

## 3. Apartado Técnico y Arquitectura

SisGest adopta una arquitectura desacoplada donde el Front-End está completamente separado del motor de persistencia mediante un **Patrón Proveedor (Provider Pattern)**. 

### Estructura de Directorios Principal
```
SisGest-CEIJA-Alberdi/
├── docs/                   # Diagramas y documentación SQL
│   ├── README.md           # Resumen técnico inicial
│   └── diagramas_bases.md  # Diagramas de flujo y modelado ER (Mermaid)
├── src/
│   ├── components/         # Módulos reactivos (Calendar, Todo, Student, etc.)
│   ├── context/            # Contexto global (Autenticación y Diálogos)
│   ├── db/                 # Capa de datos del Patrón Proveedor
│   │   ├── index.js              # Interfaz unificada de selección
│   │   ├── localMockProvider.js  # Lógica offline en LocalStorage
│   │   ├── firebaseProvider.js   # Lógica online con Firestore NoSQL
│   │   └── supabaseProvider.js   # Lógica online con Supabase/PostgreSQL
│   ├── App.jsx             # Punto de entrada de enrutamiento y carga de módulos
│   └── main.jsx            # Inicialización de React
├── schema.sql              # Estructura DDL para la base de datos PostgreSQL
└── vite.config.js          # Configuración del empaquetador Vite
```

---

## 4. Justificación Tecnológica (Frameworks e Infraestructura)

### 4.1 React (Biblioteca de UI)
* **¿Por qué React?** Al ser una aplicación con múltiples módulos interactivos (el calendario, la grilla de horarios interactiva y el panel de estudiantes requieren actualizaciones en tiempo real y componentes con estado), React permite renderizar de manera eficiente los elementos del DOM.
* **Beneficio:** Componentización del sistema, facilitando que el desarrollo de `TodoModule.jsx` o `ScheduleModule.jsx` se mantenga aislado y modular.

### 4.2 Vite (Herramienta de Construcción)
* **¿Por qué Vite en vez de CRA (Create React App)?** Vite ofrece un servidor de desarrollo extremadamente veloz basado en ESM nativos (Hot Module Replacement instantáneo) y compila el bundle de producción de forma ultra optimizada usando **Rollup/Rolldown**.
* **Beneficio:** Tiempos de compilación menores a 10 segundos, inyección transparente de variables `.env` (como `VITE_DB_PROVIDER`), y soporte nativo para importar JSONs de gran tamaño (como las semillas de prueba).

### 4.3 Firebase vs Supabase (Estrategia NoSQL y Relacional)
* **Firebase (NoSQL / Firestore):** Inicialmente elegido por su sencillez al carecer de esquemas (esquema dinámico). Es excelente para prototipado rápido y almacenamiento de documentos anidados JSON como la grilla de horarios.
* **Supabase (PostgreSQL Relacional):** Incorporado para satisfacer el requerimiento de integridad referencial. Una base de datos relacional (PostgreSQL) garantiza restricciones clave como `ON DELETE CASCADE` (si eliminas un estudiante, se borran sus materias previas automáticamente) y tipos estrictos de datos, asegurando la consistencia administrativa a largo plazo.

---

## 5. Gestión de Datos y Multiproveedor

La aplicación se comunica con el exterior de manera abstracta. El archivo `src/db/index.js` evalúa la variable de entorno `VITE_DB_PROVIDER` y exporta las funciones del proveedor correspondiente.

### Capa de Adaptación (Mapeo de Datos)
Dado que Firebase opera de forma nativa con el formato libre enviado por la UI, y Supabase (PostgreSQL) requiere columnas específicas, se implementó un mapeo bidireccional en `supabaseProvider.js`:

* **Mapeo de Fechas del Calendario:** La UI envía `startDate`/`endDate`, pero la base de datos relacional espera `fecha_inicio`/`fecha_fin`. El proveedor traduce los nombres de campos al guardar y reconstruye las variables necesarias de la UI al leer.
* **Mapeo de Tareas (To-Do List):** La UI utiliza `fecha_limite`, mapeada automáticamente por el proveedor a la columna `fecha_vencimiento` de la tabla `tareas_admin`, además de inyectar por defecto el campo obligatorio `descripcion` para cumplir con las restricciones del motor SQL.

---

## 6. Instalación y Despliegue

### 6.1 Requisitos Previos
* Node.js (v18 o superior)
* npm (v9 o superior)

### 6.2 Configuración del Archivo `.env`
Crea un archivo `.env` en la raíz del proyecto basándote en la siguiente estructura:
```env
# Configuración de Persistencia (supabase | firebase | mock)
VITE_DB_PROVIDER=supabase

# Supabase Credentials
VITE_SUPABASE_URL=https://jeupmxocuzbsfrpydpge.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_supabase

# Firebase Credentials (Opcional)
VITE_FIREBASE_API_KEY=tu_api_key_firebase
VITE_FIREBASE_AUTH_DOMAIN=tu_auth_domain_firebase
VITE_FIREBASE_PROJECT_ID=tu_project_id_firebase
VITE_FIREBASE_STORAGE_BUCKET=tu_storage_bucket_firebase
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_messaging_sender_id_firebase
VITE_FIREBASE_APP_ID=tu_app_id_firebase
```

### 6.3 Ejecución Local
1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Iniciar el servidor de desarrollo local:
   ```bash
   npm run dev
   ```
3. Construir para producción:
   ```bash
   npm run build
   ```

### 6.4 Despliegue Continuo (CI/CD)
El sistema cuenta con un pipeline automatizado en **GitHub Actions** (`.github/workflows/deploy.yml`). Al realizar un `git push` a la rama `main`:
1. El workflow inicia un entorno limpio de Node.js.
2. Inyecta de forma segura las variables públicas de Supabase y Firebase.
3. Compila la SPA con `npm run build`.
4. Despliega el resultado directamente en **GitHub Pages**.
