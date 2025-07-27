import axios from "axios";
import { auth } from "../firebase"; // solo para obtener el UID del usuario logueado

const API_URL = "http://localhost:8080/appMedica"; // Asegúrate de que coincide con tu backend

const obtenerCitasDePaciente = async (uid) => {
  try {
    const response = await axios.get(`${API_URL}/citas`, {
      params: { pacienteId: uid },
    });

    const citasCrudas = response.data; // se espera un arreglo de objetos

    const citas = citasCrudas.map((cita) => {
      const fechaFormateada = new Date(cita.fecha).toLocaleString("es-EC", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });

      return {
        id: cita.id || "Sin ID",
        especialidad: cita.especialidad || "No especificada",
        fecha: fechaFormateada,
        motivo: cita.motivo || "Sin motivo",
        estado: cita.estado || "Pendiente",
        nombreMedico: cita.nombreMedico || "Desconocido",
        horarioId: cita.horarioId || "No especificado",
      };
    });

    return citas;
  } catch (error) {
    console.error("Error al obtener las citas del paciente:", error);
    return [];
  }
};

export default obtenerCitasDePaciente;