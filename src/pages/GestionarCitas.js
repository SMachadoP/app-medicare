import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { auth } from "../firebase"; // solo para usar auth.currentUser

const API_URL = "http://localhost:8080/appMedica";

export default function GestionarCitas() {
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);

  const medicoId = auth.currentUser?.uid;

  // 2) Filtros past
  const [from,   setFrom]   = useState("");
  const [to,     setTo]     = useState("");
  const [estado, setEstado] = useState("");

  const cargarCitas = useCallback(async () => {
    setCargando(true);
    if (!medicoId) {
      setCitas([]);
      setCargando(false);
      return;
    }
    try {
      const { data } = await axios.get(`${API_URL}/citas`, { params: { medicoId } });
      setCitas(data);
    } catch (err) {
      console.error("Error cargando citas:", err);
      setCitas([]);
    } finally {
      setCargando(false);
    }
  }, [medicoId]);

  // 2) La usamos en el useEffect y la ponemos en el array de deps
  useEffect(() => {
    cargarCitas();
  }, [cargarCitas]);

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
      alert("No se pudo actualizar la cita.");
    }
  };

  const formatearFecha = (fecha) => {
    const date = new Date(fecha);
    return date.toLocaleString("es-EC", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 5) División pendiente vs pasado
  const ahora = new Date();
  const citasFuturas = citas.filter(c => new Date(c.fecha) >= ahora);
  let citasPasadas    = citas.filter(c => new Date(c.fecha) < ahora);

  // 6) Aplicar filtros a las pasadas
  if (from)   citasPasadas = citasPasadas.filter(c => new Date(c.fecha) >= new Date(from));
  if (to)     citasPasadas = citasPasadas.filter(c => new Date(c.fecha) <= new Date(to));
  if (estado) citasPasadas = citasPasadas.filter(c => c.estado === estado);


  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "1rem" }}>
      <h2>Mis Citas Pendientes</h2>

      {cargando ? (
        <p>Cargando citas...</p>
      ) : citasFuturas.length === 0 ? (
        <p>No tienes citas agendadas.</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "1rem",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f2f2f2" }}>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>
                Paciente
              </th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>
                Fecha
              </th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>
                Estado Actual
              </th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>
                Cambiar Estado
              </th>
            </tr>
          </thead>
          <tbody>
            {citas.map((cita) => (
              <tr key={cita.id}>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {cita.nombrePaciente || "Sin nombre"}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {formatearFecha(cita.fecha)}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {cita.estado}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  <select
                    value={cita.estado}
                    onChange={(e) =>
                      cambiarEstado(cita.id, e.target.value, cita.horarioId)
                    }
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

      <h2>Historial de Citas</h2>
      {/* Controles de filtro */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
        <label>Desde <input type="date" value={from} onChange={e=>setFrom(e.target.value)} /></label>
        <label>Hasta <input type="date" value={to}   onChange={e=>setTo(e.target.value)} /></label>
        <label>Estado
          <select value={estado} onChange={e=>setEstado(e.target.value)}>
            <option value="">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="confirmada">Confirmada</option>
            <option value="negada">Negada</option>
          </select>
        </label>
        <button onClick={() => {/* opcional: recargar o limpiar filtros */}}>Aplicar</button>
      </div>

      {/* Tabla de pasadas */}
      {cargando ? <p>Cargando…</p>
        : citasPasadas.length === 0 ? <p>No hay citas pasadas.</p>
        : (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>{/* cabecera similar */}</thead>
            <tbody>
              {citasPasadas.map(c => (
                <tr key={c.id}>
                  <td>{c.nombrePaciente}</td>
                  <td>{formatearFecha(c.fecha)}</td>
                  <td>{c.estado}</td>
                  {/* no hay “Cambiar estado” aquí */}
                </tr>
              ))}
            </tbody>
          </table>
        )
      }
    </div>
  );
}

