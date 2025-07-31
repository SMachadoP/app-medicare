import { useState, useEffect, useCallback } from "react";
import { getAuth } from "firebase/auth";

export default function AgregarHorario() {
  const [datetimeLocal, setDatetimeLocal] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [medicoId, setMedicoId] = useState(null);

  const auth = getAuth();
  const user = auth.currentUser;

  // 1) Memoiza la función que usa auth y API
  const obtenerMedico = useCallback(async () => {
    const user = auth.currentUser;
    if (!user?.email) return;

    try {
      const res = await fetch(`http://localhost:8080/appMedica/rest/usuarios/correo/${user.email}`);
      if (!res.ok) throw new Error("No se encontró el médico.");

      const medico = await res.json();
      if (medico.length > 0) {
        setMedicoId(medico[0].id);
      } else {
        alert("No se encontró ningún médico con ese correo.");
      }
    } catch (err) {
      alert("No se pudo obtener el ID del médico.");
    }
  }, [auth]);

  const generarHorariosPorDefecto = async () => {
    if (!user) {
      alert("Usuario no autenticado.");
      return;
    }

    try {
      setGenerando(true);
      const token = await user.getIdToken();

      const response = await fetch(
        "http://localhost:8080/appMedica/rest/horarios/generar",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const res = await response.json();
        alert(res.mensaje || "Horarios generados correctamente.");
      } else {
        const error = await response.text();
        alert("Error al generar horarios: " + error);
      }
    } catch (err) {
      alert("Ocurrió un error al generar los horarios.");
    } finally {
      setGenerando(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!datetimeLocal) {
      alert("Debes elegir fecha y hora.");
      return;
    }

    if (!user) {
      alert("Usuario no autenticado.");
      return;
    }

    if (!medicoId) {
      alert("No se encontró el médico para asociar el horario.");
      return;
    }

    try {
      setEnviando(true);
      const token = await user.getIdToken();
      const fechaIso = new Date(datetimeLocal).toISOString();

      const horarioEnviar = {
        fecha: fechaIso,
        disponible: true,
        medico: {
          id: medicoId,
        },
      };

      const response = await fetch(
        "http://localhost:8080/appMedica/rest/horarios",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(horarioEnviar),
        }
      );

      if (response.ok) {
        alert("Horario guardado correctamente.");
        setDatetimeLocal("");
      } else {
        let errorText;
        try {
          errorText = await response.text();
        } catch {
          errorText = response.statusText;
        }
        alert("Error del servidor: " + errorText);
      }
    } catch (error) {
      alert("Hubo un error al guardar el horario.");
    } finally {
      setEnviando(false);
    }
  };

  // 2) Úsala en el useEffect y ponla en el array de dependencias
  useEffect(() => {
    obtenerMedico();
  }, [obtenerMedico]);

  return (
    <div style={{ maxWidth: "400px", margin: "1rem auto" }}>
      <h3>Agregar Horario de Atención</h3>

      <button
        onClick={generarHorariosPorDefecto}
        disabled={generando}
        style={{
          backgroundColor: "#38a169",
          color: "white",
          border: "none",
          padding: "0.5rem 1rem",
          borderRadius: "4px",
          cursor: "pointer",
          marginBottom: "1rem",
          width: "100%",
        }}
      >
        {generando ? "Generando..." : "Generar Horarios por Defecto"}
      </button>

      <form onSubmit={handleSubmit}>
        <label>Fecha y Hora:</label>
        <input
          type="datetime-local"
          value={datetimeLocal}
          onChange={(e) => setDatetimeLocal(e.target.value)}
          required
        />
        <br />
        <br />
        <button
          type="submit"
          disabled={enviando}
          style={{
            backgroundColor: "#2b6cb0",
            color: "white",
            border: "none",
            padding: "0.5rem 1rem",
            borderRadius: "4px",
            cursor: "pointer",
            marginTop: "1rem",
          }}
        >
          {enviando ? "Guardando..." : "Guardar Horario"}
        </button>
      </form>
    </div>
  );
}
