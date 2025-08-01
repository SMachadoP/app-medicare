import { useEffect, useState } from "react";
import axios from "axios";
import { auth } from "../firebase";

// Configurar axios globalmente para este archivo
axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'true';

const API_URL = "https://b2b642415388.ngrok-free.app/appMedica/rest";

export default function GestionarCitas() {
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [medicoData, setMedicoData] = useState(null);

  // Filtros para citas pasadas
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [estado, setEstado] = useState("");

  useEffect(() => {
    const cargarCitas = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setCitas([]);
        setCargando(false);
        return;
      }

      try {
        // 1. Obtener los datos del médico por email
        const medicoResponse = await axios.get(`${API_URL}/usuarios/correo/${currentUser.email}`);
        const medicoInfo = medicoResponse.data[0];
        
        if (!medicoInfo) {
          setCitas([]);
          setCargando(false);
          return;
        }

        setMedicoData(medicoInfo);

        // 2. Obtener citas del médico usando el endpoint de historial con filtros
        const citasResponse = await axios.get(`${API_URL}/citas/historial`, {
          params: {
            medicoId: medicoInfo.id
          }
        });
        
        setCitas(citasResponse.data || []);
      } catch (error) {
        console.error("Error cargando citas:", error);
        if (error.response?.status === 404) {
          setCitas([]);
        } else {
          setCitas([]);
        }
      } finally {
        setCargando(false);
      }
    };

    cargarCitas();
  }, []);

  const cambiarEstado = async (citaId, nuevoEstado, horarioId) => {
    try {
      // Actualizar estado de la cita
      await axios.put(`${API_URL}/citas/${citaId}`, {
        estado: nuevoEstado,
      });

      // Si es negada, hacer horario disponible
      if (nuevoEstado === "negada" && horarioId) {
        await axios.patch(`${API_URL}/horarios/${horarioId}`, {
          disponible: true,
        });
      }

      // Si es confirmada o pendiente, hacer horario no disponible
      if (
        (nuevoEstado === "confirmada" || nuevoEstado === "pendiente") &&
        horarioId
      ) {
        await axios.patch(`${API_URL}/horarios/${horarioId}`, {
          disponible: false,
        });
      }

      // Actualizar estado en UI
      setCitas((prev) =>
        prev.map((cita) =>
          cita.id === citaId ? { ...cita, estado: nuevoEstado } : cita
        )
      );
    } catch (error) {
      console.error("Error al actualizar cita u horario:", error);
      alert("No se pudo actualizar la cita: " + (error.response?.data?.message || error.message));
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "Fecha no disponible";
    
    try {
      // Limpiar la fecha si tiene sufijos como [UTC]
      const fechaLimpia = fecha.includes('[') ? fecha.substring(0, fecha.indexOf('[')).trim() : fecha;
      const date = new Date(fechaLimpia);
      
      if (isNaN(date.getTime())) {
        return "Fecha inválida";
      }
      
      return date.toLocaleString("es-EC", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Guayaquil"
      });
    } catch (error) {
      console.error("Error formateando fecha:", error);
      return "Error en fecha";
    }
  };

  // División pendiente vs pasado - CORREGIDO
  const ahora = new Date();
  const citasFuturas = [];
  const citasPasadas = [];
  
  citas.forEach((c) => {
    const fechaLimpia = c.fecha.includes('[') 
      ? c.fecha.substring(0, c.fecha.indexOf('[')).trim() 
      : c.fecha;
    const fechaCita = new Date(fechaLimpia);
    const esFutura = fechaCita > ahora;
    
    if (esFutura) {
      citasFuturas.push(c);
    } else {
      citasPasadas.push(c);
    }
  });

  // Aplicar filtros a las pasadas - CORREGIDO para no mutar el original
  let citasFiltradasPasadas = [...citasPasadas];
  
  if (from) {
    citasFiltradasPasadas = citasFiltradasPasadas.filter(c => {
      const fechaLimpia = c.fecha.includes('[') 
        ? c.fecha.substring(0, c.fecha.indexOf('[')).trim() 
        : c.fecha;
      const fechaCita = new Date(fechaLimpia);
      const fechaFiltro = new Date(from);
      return fechaCita >= fechaFiltro;
    });
  }
  
  if (to) {
    citasFiltradasPasadas = citasFiltradasPasadas.filter(c => {
      const fechaLimpia = c.fecha.includes('[') 
        ? c.fecha.substring(0, c.fecha.indexOf('[')).trim() 
        : c.fecha;
      const fechaCita = new Date(fechaLimpia);
      const fechaFiltro = new Date(to + 'T23:59:59');
      return fechaCita <= fechaFiltro;
    });
  }
  
  if (estado) {
    citasFiltradasPasadas = citasFiltradasPasadas.filter(c => c.estado === estado);
  }

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "1rem",
  };

  const thStyle = {
    border: "1px solid #dee2e6",
    padding: "12px 8px",
    backgroundColor: "#f8f9fa",
    textAlign: "left",
    fontWeight: "bold"
  };

  const tdStyle = {
    border: "1px solid #dee2e6",
    padding: "8px",
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "1rem" }}>
      <h2>Gestión de Citas</h2>
      
      {medicoData && (
        <div style={{ 
          backgroundColor: "#e7f3ff", 
          padding: "1rem", 
          borderRadius: "4px", 
          marginBottom: "1rem" 
        }}>
          <p><strong>Médico:</strong> {medicoData.nombre}</p>
          <p><strong>Especialidad:</strong> {medicoData.especialidad?.nombreEspecialidad || "No asignada"}</p>
        </div>
      )}

      <h3>Citas Pendientes ({citasFuturas.length})</h3>

      {cargando ? (
        <p>Cargando citas...</p>
      ) : citasFuturas.length === 0 ? (
        <p style={{ color: "#6c757d", fontStyle: "italic" }}>
          No tienes citas pendientes.
        </p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Paciente</th>
              <th style={thStyle}>Fecha y Hora</th>
              <th style={thStyle}>Estado Actual</th>
              <th style={thStyle}>Cambiar Estado</th>
            </tr>
          </thead>
          <tbody>
            {citasFuturas.map((cita) => (
              <tr key={cita.id}>
                <td style={tdStyle}>
                  {cita.paciente?.nombre || "Sin nombre"}
                </td>
                <td style={tdStyle}>
                  {formatearFecha(cita.fecha)}
                </td>
                <td style={tdStyle}>
                  <span style={{
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "0.875rem",
                    fontWeight: "bold",
                    backgroundColor: 
                      cita.estado === "confirmada" ? "#d4edda" :
                      cita.estado === "pendiente" ? "#fff3cd" :
                      cita.estado === "negada" ? "#f8d7da" : "#e2e3e5",
                    color:
                      cita.estado === "confirmada" ? "#155724" :
                      cita.estado === "pendiente" ? "#856404" :
                      cita.estado === "negada" ? "#721c24" : "#495057"
                  }}>
                    {cita.estado}
                  </span>
                </td>
                <td style={tdStyle}>
                  <select
                    value={cita.estado}
                    onChange={(e) =>
                      cambiarEstado(cita.id, e.target.value, cita.horario?.id)
                    }
                    style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      border: "1px solid #ced4da"
                    }}
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="confirmada">Confirmada</option>
                    <option value="negada">Negada</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3 style={{ marginTop: "2rem" }}>Historial de Citas ({citasFiltradasPasadas.length})</h3>
      
      {/* Controles de filtro */}
      <div style={{ 
        display: "flex", 
        gap: "1rem", 
        marginBottom: "1rem", 
        flexWrap: "wrap",
        padding: "1rem",
        backgroundColor: "#f8f9fa",
        borderRadius: "4px"
      }}>
        <label style={{ display: "flex", flexDirection: "column", minWidth: "150px" }}>
          <span style={{ marginBottom: "4px", fontWeight: "bold" }}>Desde</span>
          <input 
            type="date" 
            value={from} 
            onChange={e => setFrom(e.target.value)}
            style={{ padding: "4px", borderRadius: "4px", border: "1px solid #ced4da" }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", minWidth: "150px" }}>
          <span style={{ marginBottom: "4px", fontWeight: "bold" }}>Hasta</span>
          <input 
            type="date" 
            value={to} 
            onChange={e => setTo(e.target.value)}
            style={{ padding: "4px", borderRadius: "4px", border: "1px solid #ced4da" }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", minWidth: "150px" }}>
          <span style={{ marginBottom: "4px", fontWeight: "bold" }}>Estado</span>
          <select 
            value={estado} 
            onChange={e => setEstado(e.target.value)}
            style={{ padding: "4px", borderRadius: "4px", border: "1px solid #ced4da" }}
          >
            <option value="">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="confirmada">Confirmada</option>
            <option value="negada">Negada</option>
          </select>
        </label>
        <button 
          onClick={() => {
            setFrom("");
            setTo("");
            setEstado("");
          }}
          style={{
            alignSelf: "flex-end",
            padding: "6px 12px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Limpiar Filtros
        </button>
      </div>

      {/* Tabla de citas pasadas */}
      {cargando ? (
        <p>Cargando historial...</p>
      ) : citasFiltradasPasadas.length === 0 ? (
        <p style={{ color: "#6c757d", fontStyle: "italic" }}>
          No hay citas en el historial con los filtros aplicados.
        </p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Paciente</th>
              <th style={thStyle}>Fecha y Hora</th>
              <th style={thStyle}>Estado Final</th>
            </tr>
          </thead>
          <tbody>
            {citasFiltradasPasadas.map(c => (
              <tr key={c.id}>
                <td style={tdStyle}>
                  {c.paciente?.nombre || "Sin nombre"}
                </td>
                <td style={tdStyle}>
                  {formatearFecha(c.fecha)}
                </td>
                <td style={tdStyle}>
                  <span style={{
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "0.875rem",
                    fontWeight: "bold",
                    backgroundColor: 
                      c.estado === "confirmada" ? "#d4edda" :
                      c.estado === "pendiente" ? "#fff3cd" :
                      c.estado === "negada" ? "#f8d7da" : "#e2e3e5",
                    color:
                      c.estado === "confirmada" ? "#155724" :
                      c.estado === "pendiente" ? "#856404" :
                      c.estado === "negada" ? "#721c24" : "#495057"
                  }}>
                    {c.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}