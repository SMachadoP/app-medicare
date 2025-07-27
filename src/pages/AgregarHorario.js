import { useState } from "react";
import { getAuth } from "firebase/auth";

export default function AgregarHorario() {
  const [datetimeLocal, setDatetimeLocal] = useState("");
  const [enviando, setEnviando] = useState(false);

  const auth = getAuth();
  const user = auth.currentUser;

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

    try {
      setEnviando(true);

      // Obtener el token JWT de Firebase
      const token = await user.getIdToken();

      // Enviar el horario al backend Java
      const response = await fetch("http://localhost:8080/appMedica/horarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fechaHora: datetimeLocal, // formato: "YYYY-MM-DDTHH:mm"
        }),
      });

      if (response.ok) {
        alert("Horario guardado correctamente.");
        setDatetimeLocal("");
      } else {
        const error = await response.json();
        alert("Error del servidor: " + (error.message || response.statusText));
      }
    } catch (error) {
      console.error("Error al guardar el horario:", error);
      alert("Hubo un error al guardar el horario.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "400px", margin: "1rem auto" }}>
      <h3>Agregar Horario de Atención</h3>
      <label>Fecha y Hora:</label>
      <input
        type="datetime-local"
        value={datetimeLocal}
        onChange={(e) => setDatetimeLocal(e.target.value)}
        required
      />
      <br /><br />
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
          marginTop: "1rem"
        }}
      >
        {enviando ? "Guardando..." : "Guardar Horario"}
      </button>
    </form>
  );
}

