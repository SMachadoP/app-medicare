import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import SolicitarCita from "./SolicitarCita";
import logo from "../logoclinica.jpg";
import fondoClinica from "../fondoPaginaWeb.jpg";
import { Link } from "react-router-dom";

const PacientePerfil = () => {
  const [datos, setDatos] = useState({
    nombre: "",
    cedula: "",
    telefono: "",
    direccion: "",
    genero: ""
  });

  const [user, setUser] = useState(null);
  const [citas, setCitas] = useState([]);
  const [vistaActiva, setVistaActiva] = useState("perfil");
  const [hoverCancel, setHoverCancel] = useState(null);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (usuario) => {
      if (usuario) {
        setUser(usuario);
        await cargarDatos(usuario.email);
        await cargarCitas(usuario.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const cargarDatos = async (correo) => {
  try {
    const res = await fetch(`http://localhost:8080/appMedica/rest/usuarios/correo/${correo}`);
    if (!res.ok) throw new Error("Error al obtener datos del paciente");
    const data = await res.json();

    if (Array.isArray(data) && data.length > 0) {
      setDatos(data[0]); // toma el primer objeto del array
    } else {
      console.warn("No se encontró usuario con ese correo");
      setDatos({
        nombre: "",
        cedula: "",
        telefono: "",
        direccion: "",
        genero: ""
      });
    }
  } catch (error) {
    console.error("Error cargando perfil:", error);
  }
};


  const cargarCitas = async (uid) => {
    try {
      const res = await fetch(`http://localhost:8080/appMedica/citas/paciente/${uid}`);
      if (!res.ok) throw new Error("Error al obtener citas");
      const citasObtenidas = await res.json();
      setCitas(citasObtenidas);
    } catch (error) {
      console.error("Error cargando citas:", error);
    }
  };

  const manejarCambio = (e) => {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  };

  const validarCedula = (cedula) => {
    if (!/^\d{10}$/.test(cedula)) return false;
    const digitos = cedula.split("").map(Number);
    const provincia = parseInt(cedula.substring(0, 2), 10);
    if (provincia < 1 || provincia > 24) return false;
    if (digitos[2] >= 6) return false;

    let suma = 0;
    for (let i = 0; i < 9; i++) {
      let val = digitos[i];
      if (i % 2 === 0) {
        val *= 2;
        if (val > 9) val -= 9;
      }
      suma += val;
    }
    const decenaSuperior = Math.ceil(suma / 10) * 10;
    const digitoVerificador = decenaSuperior - suma === 10 ? 0 : decenaSuperior - suma;

    return digitoVerificador === digitos[9];
  };

  const validarTelefono = (telefono) => /^\d{10}$/.test(telefono);

  const guardarPerfil = async (e) => {
    e.preventDefault();

    if (!validarCedula(datos.cedula)) return alert("Cédula no válida.");
    if (!validarTelefono(datos.telefono)) return alert("Teléfono no válido.");

    try {
      const res = await fetch(`http://localhost:8080/appMedica/pacientes/${user.uid}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(datos)
      });

      if (!res.ok) throw new Error("Error al actualizar el perfil");

      alert("Perfil actualizado correctamente");
    } catch (error) {
      console.error("Error al guardar perfil:", error);
    }
  };

  const cancelarCita = async (citaId) => {
    if (!window.confirm("¿Estás seguro de que quieres cancelar esta cita?")) return;

    try {
      const res = await fetch(`http://localhost:8080/appMedica/citas/${citaId}`, {
        method: "DELETE"
      });

      if (!res.ok) throw new Error("Error al cancelar cita");

      setCitas((prev) => prev.filter((cita) => cita.id !== citaId));
      alert("Cita cancelada correctamente.");
    } catch (error) {
      console.error("Error cancelando cita:", error);
      alert("No se pudo cancelar la cita.");
    }
  };

  // (Estilos sin cambio, puedes mantener los que ya tenías)

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Menú lateral */}
      <nav style={{ width: "220px", backgroundColor: "#2b6cb0", color: "white", padding: "1rem" }}>
        <Link to="/">
          <img src={logo} alt="Logo Clínica" style={{ height: "50px", marginBottom: "1rem" }} />
        </Link>
        <button onClick={() => setVistaActiva("perfil")} style={{ ...navBtnStyle }}>Mi Perfil</button>
        <button onClick={() => setVistaActiva("solicitar")} style={{ ...navBtnStyle }}>Solicitar Cita</button>
        <button onClick={() => setVistaActiva("citas")} style={{ ...navBtnStyle }}>Mis Citas</button>
      </nav>

      {/* Contenido principal */}
      <main style={{
        flexGrow: 1,
        backgroundImage: `url(${fondoClinica})`,
        backgroundSize: "cover",
        padding: "2rem",
        display: "flex",
        justifyContent: "center"
      }}>
        <div style={{
          width: "100%",
          maxWidth: "600px",
          backgroundColor: "rgba(255,255,255,0.9)",
          borderRadius: "8px",
          padding: "2rem"
        }}>
          <h1 style={{ textAlign: "center", color: "#2b6cb0" }}>Clínica San Sebastián</h1>

          {vistaActiva === "perfil" && (
            <form onSubmit={guardarPerfil} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <h2>Mi Perfil</h2>
              <input type="text" name="nombre" value={datos.nombre} onChange={manejarCambio} required placeholder="Nombre" />
              <input type="text" name="cedula" value={datos.cedula} onChange={manejarCambio} required placeholder="Cédula" />
              <input type="tel" name="telefono" value={datos.telefono} onChange={manejarCambio} required placeholder="Teléfono" />
              <input type="text" name="direccion" value={datos.direccion} onChange={manejarCambio} required placeholder="Dirección" />
              <input type="text" name="genero" value={datos.genero} onChange={manejarCambio} required placeholder="Género" />
              <button type="submit">Guardar Cambios</button>
            </form>
          )}

          {vistaActiva === "solicitar" && (
            <>
              <h2>Solicitar Cita</h2>
              <SolicitarCita userId={user?.uid} />
            </>
          )}

          {vistaActiva === "citas" && (
            <>
              <h2>Mis Citas</h2>
              {citas.length === 0 ? (
                <p>No tienes citas registradas.</p>
              ) : (
                citas.map((cita) => (
                  <div key={cita.id} style={{ border: "1px solid #ccc", padding: "1rem", marginBottom: "1rem", borderRadius: "8px" }}>
                    <p><strong>Especialidad:</strong> {cita.especialidad}</p>
                    <p><strong>Doctor:</strong> {cita.nombreMedico}</p>
                    <p><strong>Fecha:</strong> {cita.fecha}</p>
                    <p><strong>Estado:</strong> {cita.estado}</p>
                    {(cita.estado === "pendiente" || cita.estado === "confirmada") && (
                      <button onClick={() => cancelarCita(cita.id)}>Cancelar Cita</button>
                    )}
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

const navBtnStyle = {
  display: "block",
  width: "100%",
  backgroundColor: "transparent",
  color: "white",
  border: "none",
  padding: "0.75rem 0",
  fontSize: "16px",
  textAlign: "left",
  cursor: "pointer",
  borderBottom: "1px solid rgba(255,255,255,0.3)",
};

export default PacientePerfil;


