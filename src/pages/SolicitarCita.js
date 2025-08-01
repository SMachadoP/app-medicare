// src/components/SolicitarCita.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { auth } from "../firebase";

const SolicitarCita = ({ userId, onCitaAgendada }) => {
  const [especialidades, setEspecialidades] = useState([]);
  const [especialidadSel, setEspecialidadSel] = useState("");
  const [medicos, setMedicos] = useState([]);
  const [medicoSel, setMedicoSel] = useState("");
  const [horarios, setHorarios] = useState([]);
  const [horarioSel, setHorarioSel] = useState("");
  const [timestampSeleccionado, setTimestampSeleccionado] = useState(null);
  const [cargando, setCargando] = useState({
    especialidades: true,
    medicos: false,
    horarios: false,
  });

  const API = "https://b2b642415388.ngrok-free.app/appMedica/rest";
  const pacienteEmail = auth.currentUser?.email;

  // Carga encabezados comunes
  const getHeaders = async (includeJson = false) => {
    const token = await auth.currentUser.getIdToken();
    const headers = {
      "ngrok-skip-browser-warning": "true",
      Authorization: `Bearer ${token}`,
    };
    if (includeJson) headers["Content-Type"] = "application/json";
    return headers;
  };

  // Cargar especialidades
  useEffect(() => {
    const cargarEspecialidades = async () => {
      try {
        const headers = await getHeaders();
        const res = await axios.get(`${API}/especialidades`, { headers });
        setEspecialidades(res.data);
      } catch (error) {
        console.error("Error al cargar especialidades:", error);
      } finally {
        setCargando((prev) => ({ ...prev, especialidades: false }));
      }
    };
    cargarEspecialidades();
  }, []);

  // Cargar médicos según especialidad
  useEffect(() => {
    if (!especialidadSel) {
      setMedicos([]);
      setMedicoSel("");
      return;
    }
    const cargarMedicos = async () => {
      setCargando((prev) => ({ ...prev, medicos: true }));
      try {
        const headers = await getHeaders();
        const res = await axios.get(
          `${API}/usuarios/medicoespecialidad/${especialidadSel}`,
          { headers }
        );
        setMedicos(res.data);
      } catch (error) {
        console.error("Error al cargar médicos:", error);
        setMedicos([]);
      } finally {
        setCargando((prev) => ({ ...prev, medicos: false }));
      }
    };
    cargarMedicos();
  }, [especialidadSel]);

  // Cargar horarios según médico
  useEffect(() => {
    if (!medicoSel) {
      setHorarios([]);
      setHorarioSel("");
      return;
    }
    const cargarHorarios = async () => {
      setCargando((prev) => ({ ...prev, horarios: true }));
      try {
        const headers = await getHeaders();
        const res = await axios.get(
          `${API}/horarios/idmedico/${medicoSel}`,
          { headers }
        );
        const disponibles = res.data.filter((h) => h.disponible === true);
        setHorarios(disponibles);
      } catch (error) {
        console.error("Error al cargar horarios:", error);
        setHorarios([]);
      } finally {
        setCargando((prev) => ({ ...prev, horarios: false }));
      }
    };
    cargarHorarios();
  }, [medicoSel]);

  // Agendar cita
  const agendarCita = async (e) => {
    e.preventDefault();
    if (!especialidadSel || !medicoSel || !horarioSel || !pacienteEmail) {
      alert("Debes completar todos los campos.");
      return;
    }
    try {
      const headers = await getHeaders(true);
      // Obtener datos del paciente
      const usuarioRes = await axios.get(
        `${API}/usuarios/correo/${pacienteEmail}`,
        { headers }
      );
      const paciente = usuarioRes.data[0];
      if (!paciente) {
        alert("No se encontró el paciente.");
        return;
      }
      const horarioObj = horarios.find((h) => h.id === parseInt(horarioSel));
      const medicoObj = medicos.find((m) => m.id === parseInt(medicoSel));
      const espObj = especialidades.find(
        (e) => e.id === parseInt(especialidadSel)
      );
      const cita = {
        fecha: timestampSeleccionado,
        estado: "pendiente",
        horario: horarioObj,
        paciente,
        medico: medicoObj,
        especialidad: espObj,
      };
      await axios.post(`${API}/citas`, cita, { headers });
      alert("¡Cita agendada con éxito!");
      // Reset
      setEspecialidadSel("");
      setMedicoSel("");
      setHorarios([]);
      setHorarioSel("");
      setTimestampSeleccionado(null);
      onCitaAgendada?.();
    } catch (error) {
      console.error(
        "Error al agendar cita:",
        error.response?.data || error.message
      );
      alert(
        "Error al agendar cita: " +
          (error.response?.data?.mensaje || error.message)
      );
    }
  };

  // Formateo de fecha
  const formatearFecha = (fechaStr) => {
    const fecha = new Date(fechaStr.replace("[UTC]", ""));
    return fecha.toLocaleString("es-EC", {
      dateStyle: "short",
      timeStyle: "short",
      hour12: false,
      timeZone: "America/Guayaquil",
    });
  };

  const puedeAgendar = especialidadSel && medicoSel && horarioSel;

  return (
    <div style={{ width: "100%" }}>
      <form
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        onSubmit={agendarCita}
      >
        {/* Especialidades */}
        <div>
          <label
            style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}
          >
            Especialidad
          </label>
          {cargando.especialidades ? (
            <p>Cargando especialidades...</p>
          ) : (
            <select
              value={especialidadSel}
              onChange={(e) => setEspecialidadSel(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.5rem",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            >
              <option value="">-- Selecciona una especialidad --</option>
              {especialidades.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombreEspecialidad}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Médicos */}
        <div>
          <label
            style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}
          >
            Médico
          </label>
          {cargando.medicos ? (
            <p>Cargando médicos...</p>
          ) : (
            <select
              value={medicoSel}
              onChange={(e) => setMedicoSel(e.target.value)}
              required
              disabled={!especialidadSel}
              style={{
                width: "100%",
                padding: "0.5rem",
                borderRadius: "4px",
                border: "1px solid #ccc",
                backgroundColor: !especialidadSel ? "#f5f5f5" : "white",
              }}
            >
              <option value="">-- Selecciona un médico --</option>
              {medicos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre || m.cedula}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Horarios */}
        <div>
          <label
            style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}
          >
            Horario disponible
          </label>
          {cargando.horarios ? (
            <p>Cargando horarios...</p>
          ) : horarios.length === 0 && medicoSel ? (
            <p style={{ color: "#dc3545" }}>
              No hay horarios disponibles para este médico.
            </p>
          ) : (
            <select
              value={horarioSel}
              onChange={(e) => {
                setHorarioSel(e.target.value);
                const h = horarios.find((h) => h.id === parseInt(e.target.value));
                if (h) setTimestampSeleccionado(h.fecha);
              }}
              required
              disabled={!medicoSel || horarios.length === 0}
              style={{
                width: "100%",
                padding: "0.5rem",
                borderRadius: "4px",
                border: "1px solid #ccc",
                backgroundColor:
                  !medicoSel || horarios.length === 0 ? "#f5f5f5" : "white",
              }}
            >
              <option value="">-- Selecciona un horario --</option>
              {horarios.map((h) => (
                <option key={h.id} value={h.id}>
                  {formatearFecha(h.fecha)}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Botón */}
        <button
          type="submit"
          disabled={!puedeAgendar}
          style={{
            padding: "0.75rem",
            backgroundColor: puedeAgendar ? "#28a745" : "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: puedeAgendar ? "pointer" : "not-allowed",
            fontSize: "1rem",
            fontWeight: "bold",
          }}
        >
          Agendar Cita
        </button>
      </form>
    </div>
  );
};

export default SolicitarCita;
