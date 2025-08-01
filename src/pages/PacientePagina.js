import { useEffect, useState} from "react";
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
  const [cargandoCitas, setCargandoCitas] = useState(false);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (usuario) => {
      if (usuario) {
        setUser(usuario);
        await cargarDatos(usuario.email);
        await cargarEspecialidades();
        await cargarCitas(usuario.email);
      }
    });
    return () => unsubscribe();
  }, [auth]);

  const cargarDatos = async (correo) => {
    try {
      const res = await fetch(`https://b2b642415388.ngrok-free.app/appMedica/rest/usuarios/correo/${correo}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json'
        }
      });
      if (!res.ok) throw new Error("Error al obtener datos del paciente");
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        setDatos(data[0]);
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

  const cargarEspecialidades = async () => {
    try {
      const res = await fetch(`https://b2b642415388.ngrok-free.app/appMedica/rest/especialidades`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json'
        }
      });
      if (!res.ok) throw new Error("Error al obtener especialidades");
      const data = await res.json();
      setEspList(data);
    } catch (error) {
      console.error("Error cargando especialidades:", error);
      setEspList([]);
    }
  };

  const cargarCitas = async (correo) => {
    setCargandoCitas(true);
    try {
      // 1. Obtener usuario completo a partir del correo
      const resUsuario = await fetch(`https://b2b642415388.ngrok-free.app/appMedica/rest/usuarios/correo/${correo}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json'
        }
      });
      if (!resUsuario.ok) {
        throw new Error("Error al obtener datos del usuario");
      }
      const dataUsuario = await resUsuario.json();

      if (!Array.isArray(dataUsuario) || dataUsuario.length === 0) {
        throw new Error("Usuario no encontrado");
      }

      const usuario = dataUsuario[0];

      // 2. Obtener citas con el id del usuario
      const resCitas = await fetch(`https://b2b642415388.ngrok-free.app/appMedica/rest/citas/id/${usuario.id}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json'
        }
      });
      
      if (!resCitas.ok) {
        if (resCitas.status === 404) {
          setCitas([]);
          return;
        }
        throw new Error(`Error al obtener citas: ${resCitas.status}`);
      }
      
      const citasObtenidas = await resCitas.json();
      const citasArray = Array.isArray(citasObtenidas) ? citasObtenidas : [];
      setCitas(citasArray);
    } catch (error) {
      console.error("Error cargando citas:", error);
      setCitas([]);
    } finally {
      setCargandoCitas(false);
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

    const correo = auth.currentUser.email;

    if (!validarCedula(datos.cedula)) return alert("Cédula no válida.");
    if (!validarTelefono(datos.telefono)) return alert("Teléfono no válido.");

    try {
      const res = await fetch(`https://b2b642415388.ngrok-free.app/appMedica/rest/usuarios/correo/${correo}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json'
        },
        body: JSON.stringify(datos)
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error del servidor:", errorText);
        throw new Error(`Error del servidor: ${res.status}`);
      }

      // Intentar parsear como JSON, si no, usar el texto directamente
      let responseData;
      try {
        const responseText = await res.text();
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        responseData = { mensaje: "Perfil actualizado correctamente" };
      }

      alert(responseData.mensaje || "Perfil actualizado correctamente");
    } catch (error) {
      console.error("Error al guardar perfil:", error);
      alert("Error al guardar perfil: " + error.message);
    }
  };

  const cancelarCita = async (citaId) => {
    if (!window.confirm("¿Estás seguro de que quieres cancelar esta cita?")) return;

    try {
      const res = await fetch(`https://b2b642415388.ngrok-free.app/appMedica/rest/citas/${citaId}`, {
        method: "DELETE",
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json'
        }
      });

      if (!res.ok) throw new Error("Error al cancelar cita");

      setCitas((prev) => prev.filter((cita) => cita.id !== citaId));
      alert("Cita cancelada correctamente.");
    } catch (error) {
      console.error("Error cancelando cita:", error);
      alert("No se pudo cancelar la cita.");
    }
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return "Fecha no disponible";
    
    try {
      // Limpiar la fecha si tiene sufijos como [UTC]
      const fechaLimpia = fechaStr.includes('[') ? fechaStr.substring(0, fechaStr.indexOf('[')).trim() : fechaStr;
      const fecha = new Date(fechaLimpia);
      
      if (isNaN(fecha.getTime())) {
        return "Fecha inválida";
      }
      
      return fecha.toLocaleString("es-EC", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Guayaquil"
      });
    } catch (error) {
      console.error("Error formateando fecha:", error);
      return "Error en fecha";
    }
  };

  // Función para recargar citas (útil cuando se agenda una nueva)
  const recargarCitas = () => {
    if (user?.email) {
      cargarCitas(user.email);
    }
  };

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
        <Link to="/" style={{ color: "white", textDecoration: "none", marginTop: "2rem", display: "block" }}>
          Cerrar Sesión
        </Link>
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
          maxWidth: "800px",
          backgroundColor: "rgba(255,255,255,0.95)",
          borderRadius: "8px",
          padding: "2rem"
        }}>
          <h1 style={{ textAlign: "center", color: "#2b6cb0" }}>Clínica San Sebastián</h1>

          {vistaActiva === "perfil" && (
            <form onSubmit={guardarPerfil} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <h2>Mi Perfil</h2>
              <input 
                type="text" 
                name="nombre" 
                value={datos.nombre} 
                onChange={manejarCambio} 
                required 
                placeholder="Nombre"
                style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
              />
              <input 
                type="text" 
                name="cedula" 
                value={datos.cedula} 
                onChange={manejarCambio} 
                required 
                placeholder="Cédula"
                style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
              />
              <input 
                type="tel" 
                name="telefono" 
                value={datos.telefono} 
                onChange={manejarCambio} 
                required 
                placeholder="Teléfono"
                style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
              />
              <input 
                type="text" 
                name="direccion" 
                value={datos.direccion} 
                onChange={manejarCambio} 
                required 
                placeholder="Dirección"
                style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
              />
              <input 
                type="text" 
                name="genero" 
                value={datos.genero} 
                onChange={manejarCambio} 
                required 
                placeholder="Género"
                style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
              />
              <button 
                type="submit"
                style={{ 
                  padding: "0.75rem", 
                  backgroundColor: "#2b6cb0", 
                  color: "white", 
                  border: "none", 
                  borderRadius: "4px", 
                  cursor: "pointer" 
                }}
              >
                Guardar Cambios
              </button>
            </form>
          )}

          {vistaActiva === "solicitar" && (
            <>
              <h2>Solicitar Cita</h2>
              <SolicitarCita userId={user?.uid} onCitaAgendada={recargarCitas} />
            </>
          )}

          {vistaActiva === "citas" && (
            <>
              <h2>Mis Citas</h2>
              
              {cargandoCitas ? (
                <p>Cargando citas...</p>
              ) : citas.length === 0 ? (
                <p>No tienes citas registradas.</p>
              ) : (
                <>
                  {/* Dividir pendientes y pasadas */}
                  {(() => {
                    const ahora = new Date();
                    const pendientes = [];
                    const pasadas = [];
                    
                    citas.forEach((c) => {
                      const fechaCitaStr = c.fecha;
                      const fechaLimpia = fechaCitaStr.includes('[') 
                        ? fechaCitaStr.substring(0, fechaCitaStr.indexOf('[')).trim() 
                        : fechaCitaStr;
                      const fechaCita = new Date(fechaLimpia);
                      const esFutura = fechaCita > ahora;
                      
                      if (esFutura) {
                        pendientes.push(c);
                      } else {
                        pasadas.push(c);
                      }
                    });

                    return (
                      <>
                        {/* CITAS PENDIENTES */}
                        <h3>Citas Pendientes ({pendientes.length})</h3>
                        {pendientes.length === 0 ? (
                          <p>No tienes citas pendientes.</p>
                        ) : (
                          <table style={{ width:"100%", borderCollapse:"collapse", marginBottom:"2rem" }}>
                            <thead>
                              <tr style={{ backgroundColor: "#f8f9fa" }}>
                                <th style={{ border: "1px solid #dee2e6", padding: "0.5rem", textAlign: "left" }}>Fecha</th>
                                <th style={{ border: "1px solid #dee2e6", padding: "0.5rem", textAlign: "left" }}>Médico</th>
                                <th style={{ border: "1px solid #dee2e6", padding: "0.5rem", textAlign: "left" }}>Especialidad</th>
                                <th style={{ border: "1px solid #dee2e6", padding: "0.5rem", textAlign: "left" }}>Estado</th>
                                <th style={{ border: "1px solid #dee2e6", padding: "0.5rem", textAlign: "left" }}>Acciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pendientes.map(cita => (
                                <tr key={cita.id}>
                                  <td style={{ border: "1px solid #dee2e6", padding: "0.5rem" }}>
                                    {formatearFecha(cita.fecha)}
                                  </td>
                                  <td style={{ border: "1px solid #dee2e6", padding: "0.5rem" }}>
                                    {cita.medico?.nombre || "No asignado"}
                                  </td>
                                  <td style={{ border: "1px solid #dee2e6", padding: "0.5rem" }}>
                                    {cita.especialidad?.nombreEspecialidad || "No especificada"}
                                  </td>
                                  <td style={{ border: "1px solid #dee2e6", padding: "0.5rem" }}>
                                    <span style={{ 
                                      padding: "0.25rem 0.5rem", 
                                      borderRadius: "3px", 
                                      backgroundColor: cita.estado === 'confirmada' ? '#d4edda' : 
                                                     cita.estado === 'pendiente' ? '#fff3cd' : '#f8d7da',
                                      color: cita.estado === 'confirmada' ? '#155724' : 
                                            cita.estado === 'pendiente' ? '#856404' : '#721c24'
                                    }}>
                                      {cita.estado || "Pendiente"}
                                    </span>
                                  </td>
                                  <td style={{ border: "1px solid #dee2e6", padding: "0.5rem" }}>
                                    <button 
                                      onClick={() => cancelarCita(cita.id)}
                                      style={{ 
                                        padding: "0.25rem 0.5rem", 
                                        backgroundColor: "#dc3545", 
                                        color: "white", 
                                        border: "none", 
                                        borderRadius: "3px", 
                                        cursor: "pointer",
                                        fontSize: "0.875rem"
                                      }}
                                    >
                                      Cancelar
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}

                        {/* HISTORIAL / CITAS PASADAS */}
                        <h3>Historial de Citas ({pasadas.length})</h3>
                        
                        {/* Controles de filtro */}
                        <div style={{ display:"flex", gap:"1rem", marginBottom:"1rem", flexWrap: "wrap" }}>
                          <label style={{ display: "flex", flexDirection: "column" }}>
                            Desde
                            <input
                              type="date"
                              value={from}
                              onChange={e => setFrom(e.target.value)}
                              style={{ padding: "0.25rem", borderRadius: "3px", border: "1px solid #ccc" }}
                            />
                          </label>
                          <label style={{ display: "flex", flexDirection: "column" }}>
                            Hasta
                            <input
                              type="date"
                              value={to}
                              onChange={e => setTo(e.target.value)}
                              style={{ padding: "0.25rem", borderRadius: "3px", border: "1px solid #ccc" }}
                            />
                          </label>
                          <label style={{ display: "flex", flexDirection: "column" }}>
                            Especialidad
                            <select
                              value={espId}
                              onChange={e => setEspId(e.target.value)}
                              style={{ padding: "0.25rem", borderRadius: "3px", border: "1px solid #ccc" }}
                            >
                              <option value="">Todas</option>
                              {espList.map(e => (
                                <option key={e.id} value={e.id}>
                                  {e.nombreEspecialidad}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label style={{ display: "flex", flexDirection: "column" }}>
                            Estado
                            <select
                              value={estado}
                              onChange={e => setEstado(e.target.value)}
                              style={{ padding: "0.25rem", borderRadius: "3px", border: "1px solid #ccc" }}
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
                          let filtradas = [...pasadas];
                          
                          if (from) {
                            filtradas = filtradas.filter(c => {
                              const fechaCitaStr = c.fecha;
                              const fechaLimpia = fechaCitaStr.includes('[') 
                                ? fechaCitaStr.substring(0, fechaCitaStr.indexOf('[')).trim() 
                                : fechaCitaStr;
                              const fechaCita = new Date(fechaLimpia);
                              const fechaFiltro = new Date(from);
                              return fechaCita >= fechaFiltro;
                            });
                          }
                          
                          if (to) {
                            filtradas = filtradas.filter(c => {
                              const fechaCitaStr = c.fecha;
                              const fechaLimpia = fechaCitaStr.includes('[') 
                                ? fechaCitaStr.substring(0, fechaCitaStr.indexOf('[')).trim() 
                                : fechaCitaStr;
                              const fechaCita = new Date(fechaLimpia);
                              const fechaFiltro = new Date(to + 'T23:59:59');
                              return fechaCita <= fechaFiltro;
                            });
                          }
                          
                          if (espId) {
                            filtradas = filtradas.filter(c => c.especialidad?.id?.toString() === espId);
                          }
                          
                          if (estado) {
                            filtradas = filtradas.filter(c => c.estado === estado);
                          }

                          return filtradas.length === 0 ? (
                            <p>No hay citas en el historial con los filtros aplicados.</p>
                          ) : (
                            <table style={{ width:"100%", borderCollapse:"collapse" }}>
                              <thead>
                                <tr style={{ backgroundColor: "#f8f9fa" }}>
                                  <th style={{ border: "1px solid #dee2e6", padding: "0.5rem", textAlign: "left" }}>Fecha</th>
                                  <th style={{ border: "1px solid #dee2e6", padding: "0.5rem", textAlign: "left" }}>Médico</th>
                                  <th style={{ border: "1px solid #dee2e6", padding: "0.5rem", textAlign: "left" }}>Especialidad</th>
                                  <th style={{ border: "1px solid #dee2e6", padding: "0.5rem", textAlign: "left" }}>Estado</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filtradas.map(cita => (
                                  <tr key={cita.id}>
                                    <td style={{ border: "1px solid #dee2e6", padding: "0.5rem" }}>
                                      {formatearFecha(cita.fecha)}
                                    </td>
                                    <td style={{ border: "1px solid #dee2e6", padding: "0.5rem" }}>
                                      {cita.medico?.nombre || "No asignado"}
                                    </td>
                                    <td style={{ border: "1px solid #dee2e6", padding: "0.5rem" }}>
                                      {cita.especialidad?.nombreEspecialidad || "No especificada"}
                                    </td>
                                    <td style={{ border: "1px solid #dee2e6", padding: "0.5rem" }}>
                                      <span style={{ 
                                        padding: "0.25rem 0.5rem", 
                                        borderRadius: "3px", 
                                        backgroundColor: cita.estado === 'confirmada' ? '#d4edda' : 
                                                       cita.estado === 'pendiente' ? '#fff3cd' : '#f8d7da',
                                        color: cita.estado === 'confirmada' ? '#155724' : 
                                              cita.estado === 'pendiente' ? '#856404' : '#721c24'
                                      }}>
                                        {cita.estado || "Pendiente"}
                                      </span>
                                    </td>
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