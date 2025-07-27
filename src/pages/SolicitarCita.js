// src/pages/SolicitarCita.js

import { useEffect, useState } from "react";
import axios from "axios";
import { auth } from "../firebase"; // Mantienes solo para obtener UID del login

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

  const pacienteId = auth.currentUser?.uid;
  const pacienteNombre = auth.currentUser?.displayName || "Paciente Anónimo";

  const API_URL = "http://localhost:8080/appMedica"; // Cambia por tu endpoint real

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
      return;
    }

    const cargarMedicos = async () => {
      setCargando((prev) => ({ ...prev, medicos: true }));
      try {
        const res = await axios.get(`${API_URL}/medicos`, {
          params: { especialidad: especialidadSel },
        });
        setMedicos(res.data);
      } catch (error) {
        console.error("Error al cargar médicos:", error);
      } finally {
        setCargando((prev) => ({ ...prev, medicos: false }));
      }
    };

    cargarMedicos();
  }, [especialidadSel]);

  useEffect(() => {
    if (!medicoSel) {
      setHorarios([]);
      return;
    }

    const cargarHorarios = async () => {
      setCargando((prev) => ({ ...prev, horarios: true }));
      try {
        const res = await axios.get(`${API_URL}/horarios`, {
          params: { medicoId: medicoSel },
        });
        setHorarios(res.data);
      } catch (error) {
        console.error("Error al cargar horarios:", error);
      } finally {
        setCargando((prev) => ({ ...prev, horarios: false }));
      }
    };

    cargarHorarios();
  }, [medicoSel]);

  const agendarCita = async (e) => {
    e.preventDefault();

    if (!especialidadSel || !medicoSel || !horarioSel) {
      alert("Debes completar todos los campos.");
      return;
    }

    try {
      const cita = {
        pacienteId,
        pacienteNombre,
        medicoId: medicoSel,
        especialidad: especialidadSel,
        horarioId: horarioSel,
      };
      await axios.post(`${API_URL}/citas`, cita);
      alert("¡Cita agendada con éxito!");

      // Reset
      setEspecialidadSel("");
      setMedicoSel("");
      setHorarios([]);
      setHorarioSel("");
      setTimestampSeleccionado(null);
    } catch (error) {
      console.error("Error al agendar cita:", error);
      alert("Error al agendar cita.");
    }
  };

  const formatearFecha = (isoDate) => {
    const fecha = new Date(isoDate);
    return fecha.toLocaleString("es-EC", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const puedeAgendar =
    especialidadSel !== "" && medicoSel !== "" && horarioSel !== "";

  return (
    <div style={{ width: "100%" }}>
      <form style={{ display: "flex", flexDirection: "column", gap: "1rem" }} onSubmit={agendarCita}>
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
                <option key={e.id} value={e.nombre}>
                  {e.nombre}
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
                  {m.nombre}
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
                const h = horarios.find((h) => h.id === e.target.value);
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


