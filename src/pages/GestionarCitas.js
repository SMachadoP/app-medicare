import { useEffect, useState } from "react";
import axios from "axios";
import { auth } from "../firebase"; // solo para usar auth.currentUser

const API_URL = "http://localhost:8080/appMedica";

export default function GestionarCitas() {
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);

  const medicoId = auth.currentUser?.uid;

  useEffect(() => {
    const cargarCitas = async () => {
      if (!medicoId) {
        setCitas([]);
        setCargando(false);
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/citas`, {
          params: { medicoId },
        });
        setCitas(response.data);
      } catch (error) {
        console.error("Error cargando citas:", error);
        setCitas([]);
      } finally {
        setCargando(false);
      }
    };

    cargarCitas();
  }, [medicoId]);

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

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "1rem" }}>
      <h2>Gestión de Citas (Mis Pacientes)</h2>

      {cargando ? (
        <p>Cargando citas...</p>
      ) : citas.length === 0 ? (
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
    </div>
  );
}

