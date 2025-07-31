import axios from "axios";

const API_URL = "http://localhost:8080/appMedica"; 

/**
 * Limpia la cadena de fecha eliminando el sufijo [UTC] y cualquier contenido
 * posterior a corchetes para que Date pueda parsearla correctamente.
 * @param {string} fechaStr - Fecha recibida del backend.
 * @returns {string|null} - Fecha limpia lista para parsear o null si inválida.
 */
const limpiarFecha = (fechaStr) => {
  if (!fechaStr) return null;
  const indexBracket = fechaStr.indexOf("[");
  if (indexBracket !== -1) {
    return fechaStr.substring(0, indexBracket).trim();
  }
  return fechaStr.trim();
};

/**
 * Formatea la fecha para mostrarla en zona horaria Ecuador (America/Guayaquil)
 * en formato corto legible.
 * @param {string} fechaStr - Fecha en formato ISO posiblemente con sufijos.
 * @returns {string} - Fecha formateada o mensaje de error.
 */
const formatearFecha = (fechaStr) => {
  const fechaLimpia = limpiarFecha(fechaStr);
  if (!fechaLimpia) return "Fecha inválida";

  const fecha = new Date(fechaLimpia);
  if (isNaN(fecha.getTime())) {
    console.warn("Fecha inválida al parsear:", fechaStr);
    return "Fecha inválida";
  }

  return fecha.toLocaleString("es-EC", {
    dateStyle: "short",
    timeStyle: "short",
    hour12: false,
    timeZone: "America/Guayaquil",
  });
};

/**
 * Obtiene las citas de un paciente desde el backend y formatea los datos
 * @param {string} uid - ID del paciente (user UID)
 * @returns {Promise<Array>} - Lista de citas formateadas
 */
const obtenerCitasDePaciente = async (uid) => {
  try {
    const response = await axios.get(`${API_URL}/citas`, {
      params: { pacienteId: uid },
    });

    const citasCrudas = response.data;
    if (!Array.isArray(citasCrudas)) {
      console.error("Respuesta inesperada del backend (no es array):", citasCrudas);
      return [];
    }

    const citas = citasCrudas.map((cita) => ({
      id: cita.id ?? "Sin ID",
      especialidad: cita.especialidad?.nombreEspecialidad ?? "No especificada",
      fecha: formatearFecha(cita.fecha),
      motivo: cita.motivo ?? "Sin motivo",
      estado: cita.estado ?? "Pendiente",
      nombreMedico: cita.medico?.nombre ?? "Desconocido",
      horarioId: cita.horario?.id ?? "No especificado",
    }));

    return citas;
  } catch (error) {
    console.error("Error al obtener las citas del paciente:", error);
    return [];
  }
};

export default obtenerCitasDePaciente;








