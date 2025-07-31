import { useEffect, useState, useCallback } from "react";
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

  const [from,  setFrom]  = useState("");
  const [to,    setTo]    = useState("");
  const [espId, setEspId] = useState("");
  const [estado, setEstado] = useState("");
  const [espList, setEspList] = useState([]);
  const [user, setUser] = useState(null);
  const [citas, setCitas] = useState([]);
  const [vistaActiva, setVistaActiva] = useState("perfil");
  const auth = getAuth();


  const cargarDatos = useCallback(async (correo) => {
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
  }, []);


  const cargarCitas = useCallback(async (correo) => {
    try {
      // 1. Obtener usuario completo a partir del correo
      const resUsuario = await fetch(`http://localhost:8080/appMedica/rest/usuarios/correo/${correo}`);
      if (!resUsuario.ok) throw new Error("Error al obtener datos del usuario");
      const dataUsuario = await resUsuario.json();

      if (!Array.isArray(dataUsuario) || dataUsuario.length === 0) {
        throw new Error("Usuario no encontrado");
      }

      const usuario = dataUsuario[0];

      // 2. Obtener citas con el id del usuario
      const resCitas = await fetch(`http://localhost:8080/appMedica/rest/citas/id/${usuario.id}`);
      if (!resCitas.ok) throw new Error("Error al obtener citas");
      const citasObtenidas = await resCitas.json();

      setCitas(citasObtenidas);
    } catch (error) {
      console.error("Error cargando citas:", error);
      setCitas([]); // limpiar citas en caso de error
    }
  }, []);

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

    const correo = auth.currentUser.email;

    if (!validarCedula(datos.cedula)) return alert("Cédula no válida.");
    if (!validarTelefono(datos.telefono)) return alert("Teléfono no válido.");

    try {
      const res = await fetch(`http://localhost:8080/appMedica/rest/usuarios/correo/${correo}`, {
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (usuario) => {
      if (usuario) {
        setUser(usuario);
        await cargarDatos(usuario.email);
        await cargarCitas(usuario.email);
      }
    });
    return () => unsubscribe();
  }, [auth, cargarDatos, cargarCitas]);

  useEffect(() => {
  fetch(`http://localhost:8080/appMedica/rest/especialidades`)
    .then(r => r.json())
    .then(setEspList)
    .catch(console.error);
}, []);

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

              {/* 1) Dividir pendientes y pasadas */}
              {/** convierte cita.fecha a Date */}
              {(() => {
                const ahora = new Date();
                const pendientes = citas.filter(c => new Date(c.fecha) >= ahora);
                const pasadas    = citas.filter(c => new Date(c.fecha) <  ahora);

                return (
                  <>
                    {/* ———————— PENDIENTES ———————— */}
                    <h3>Pendientes</h3>
                    {pendientes.length === 0 ? (
                      <p>No tienes citas pendientes.</p>
                    ) : (
                      <table style={{ width:"100%", borderCollapse:"collapse", marginBottom:"2rem" }}>
                        <thead>
                          <tr>
                            <th>Fecha</th>
                            <th>Médico</th>
                            <th>Especialidad</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pendientes.map(cita => (
                            <tr key={cita.id}>
                              <td>{new Date(cita.fecha).toLocaleString()}</td>
                              <td>{cita.medico?.nombre}</td>
                              <td>{cita.especialidad?.nombreEspecialidad}</td>
                              <td>{cita.estado}</td>
                              <td>
                                <button onClick={() => cancelarCita(cita.id)}>
                                  Cancelar
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {/* ———————— HISTORIAL / CITAS PASADAS ———————— */}
                    <h3>Historial</h3>
                    {/* Controles de filtro */}
                    <div style={{ display:"flex", gap:"1rem", marginBottom:"1rem" }}>
                      <label>
                        Desde
                        <input
                          type="date"
                          value={from}
                          onChange={e => setFrom(e.target.value)}
                        />
                      </label>
                      <label>
                        Hasta
                        <input
                          type="date"
                          value={to}
                          onChange={e => setTo(e.target.value)}
                        />
                      </label>
                      <label>
                        Especialidad
                        <select
                          value={espId}
                          onChange={e => setEspId(e.target.value)}
                        >
                          <option value="">Todas</option>
                          {espList.map(e => (
                            <option key={e.id} value={e.id}>
                              {e.nombreEspecialidad}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Estado
                        <select
                          value={estado}
                          onChange={e => setEstado(e.target.value)}
                        >
                          <option value="">Todos</option>
                          <option value="pendiente">Pendiente</option>
                          <option value="confirmada">Confirmada</option>
                          <option value="negada">Negada</option>
                        </select>
                      </label>
                    </div>

                    {/* Aplicamos los filtros a las pasadas */}
                    {(() => {
                      let filtradas = pasadas;
                      if (from)   filtradas = filtradas.filter(c => new Date(c.fecha) >= new Date(from));
                      if (to)     filtradas = filtradas.filter(c => new Date(c.fecha) <= new Date(to));
                      if (espId)  filtradas = filtradas.filter(c => c.especialidad?.id.toString() === espId);
                      if (estado) filtradas = filtradas.filter(c => c.estado === estado);

                      return filtradas.length === 0 ? (
                        <p>No hay citas pasadas con esos filtros.</p>
                      ) : (
                        <table style={{ width:"100%", borderCollapse:"collapse" }}>
                          <thead>
                            <tr>
                              <th>Fecha</th>
                              <th>Médico</th>
                              <th>Especialidad</th>
                              <th>Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filtradas.map(cita => (
                              <tr key={cita.id}>
                                <td>{new Date(cita.fecha).toLocaleString()}</td>
                                <td>{cita.medico?.nombre}</td>
                                <td>{cita.especialidad?.nombreEspecialidad}</td>
                                <td>{cita.estado}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    })()}
                  </>
                );
              })()}
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


