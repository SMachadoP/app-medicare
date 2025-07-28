// src/pages/SolicitarCita.js

import { useEffect, useState } from "react";
import axios from "axios";
import { auth } from "../firebase";

const SolicitarCita = () => {
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

  const API_URL = "http://localhost:8080/appMedica/rest";
  const pacienteEmail = auth.currentUser?.email;

  useEffect(() => {
    const cargarEspecialidades = async () => {
      try {
        const res = await axios.get(`${API_URL}/especialidades`);
        setEspecialidades(res.data);
      } catch (error) {
        console.error("Error al cargar especialidades:", error);
      } finally {
        setCargando((prev) => ({ ...prev, especialidades: false }));
      }
    };

    cargarEspecialidades();
  }, []);

  useEffect(() => {
    if (!especialidadSel) {
      setMedicos([]);
      setMedicoSel("");
      return;
    }

    const cargarMedicos = async () => {
      setCargando((prev) => ({ ...prev, medicos: true }));
      try {
        const res = await axios.get(`${API_URL}/usuarios/medicoespecialidad/${especialidadSel}`);
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

  useEffect(() => {
    if (!medicoSel) {
      setHorarios([]);
      setHorarioSel("");
      return;
    }

    const cargarHorarios = async () => {
      setCargando((prev) => ({ ...prev, horarios: true }));
      try {
        const res = await axios.get(`${API_URL}/horarios/idmedico/${medicoSel}`);
        setHorarios(res.data);
      } catch (error) {
        console.error("Error al cargar horarios:", error);
        setHorarios([]);
      } finally {
        setCargando((prev) => ({ ...prev, horarios: false }));
      }
    };

    cargarHorarios();
  }, [medicoSel]);

  const agendarCita = async (e) => {
    e.preventDefault();

    if (!especialidadSel || !medicoSel || !horarioSel || !pacienteEmail) {
      alert("Debes completar todos los campos.");
      return;
    }

    try {
      // Obtener datos completos del paciente por correo
      const usuarioRes = await axios.get(`${API_URL}/usuarios/correo/${pacienteEmail}`);
      const paciente = usuarioRes.data[0];

      if (!paciente) {
        alert("No se encontró el paciente.");
        return;
      }

      // Buscar el horario seleccionado para enviar toda la info anidada
      const horarioSeleccionadoObj = horarios.find((h) => h.id === parseInt(horarioSel));
      if (!horarioSeleccionadoObj) {
        alert("Horario inválido seleccionado.");
        return;
      }

      // Buscar el médico seleccionado
      const medicoSeleccionadoObj = medicos.find((m) => m.id === parseInt(medicoSel));
      if (!medicoSeleccionadoObj) {
        alert("Médico inválido seleccionado.");
        return;
      }

      // Buscar la especialidad seleccionada
      const especialidadSeleccionadaObj = especialidades.find((e) => e.id === parseInt(especialidadSel));
      if (!especialidadSeleccionadaObj) {
        alert("Especialidad inválida seleccionada.");
        return;
      }

      // Construir el objeto cita con estructura completa esperada
      const cita = {
        fecha: timestampSeleccionado,
        estado: "pendiente",
        horario: horarioSeleccionadoObj,
        paciente: paciente,
        medico: medicoSeleccionadoObj,
        especialidad: especialidadSeleccionadaObj,
      };

      await axios.post(`${API_URL}/citas`, cita);

      alert("¡Cita agendada con éxito!");

      // Resetear formulario
      setEspecialidadSel("");
      setMedicoSel("");
      setHorarios([]);
      setHorarioSel("");
      setTimestampSeleccionado(null);
    } catch (error) {
      console.error("Error al agendar cita:", error.response ? error.response.data : error.message);
      alert("Error al agendar cita: " + (error.response?.data?.mensaje || error.message || "Error desconocido"));
    }

  };

  // Limpia y formatea fecha para mostrar
  const formatearFecha = (fechaStr) => {
  const fechaLimpia = fechaStr.replace("[UTC]", "");
  const fecha = new Date(fechaLimpia);
  return fecha.toLocaleString("es-EC", {
    dateStyle: "short",
    timeStyle: "short",
    hour12: false,
    timeZone: "America/Guayaquil", // <- clave aquí
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
          <label>Especialidad</label>
          {cargando.especialidades ? (
            <p>Cargando...</p>
          ) : (
            <select
              value={especialidadSel}
              onChange={(e) => setEspecialidadSel(e.target.value)}
              required
            >
              <option value="">-- Selecciona una --</option>
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
          <label>Médico</label>
          {cargando.medicos ? (
            <p>Cargando...</p>
          ) : (
            <select
              value={medicoSel}
              onChange={(e) => setMedicoSel(e.target.value)}
              required
              disabled={!especialidadSel}
            >
              <option value="">-- Selecciona un médico --</option>
              {medicos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre || m.cedula || "Sin nombre"}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Horarios */}
        <div>
          <label>Horario</label>
          {cargando.horarios ? (
            <p>Cargando...</p>
          ) : (
            <select
              value={horarioSel}
              onChange={(e) => {
                setHorarioSel(e.target.value);
                const h = horarios.find((h) => h.id === parseInt(e.target.value));
                if (h) setTimestampSeleccionado(h.fecha);
              }}
              required
              disabled={!medicoSel}
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
        <button type="submit" disabled={!puedeAgendar}>
          Agendar Cita
        </button>
      </form>
    </div>
  );
};

export default SolicitarCita;





