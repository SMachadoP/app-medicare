import { useEffect, useState, useCallback } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import AgregarHorario from "./AgregarHorario";
import GestionarCitas from "./GestionarCitas";
import logo from "../logoclinica.jpg";
import fondoClinica from "../fondoPaginaWeb.jpg";
import { Link } from "react-router-dom";

const AdministradorPagina = () => {
  const [vista, setVista] = useState("perfil");
  const [datos, setDatos] = useState({
    nombre: "",
    cedula: "",
    telefono: "",
    especialidad: "",
  });
  const [listaEspecialidades, setListaEspecialidades] = useState([]);
  const [cargandoEspecialidades, setCargandoEspecialidades] = useState(true);
  const [user, setUser] = useState(null);

  const auth = getAuth();

  // Carga perfil
  const cargarDatosDesdeBackend = useCallback(async (usr) => {
    try {
      const token = await usr.getIdToken();
      const correo = usr.email;
      const res = await fetch(`http://localhost:8080/appMedica/rest/usuarios/correo/${correo}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const perfilArray = await res.json();
        const perfil = perfilArray[0];
        setDatos({
          nombre: perfil.nombre || "",
          cedula: perfil.cedula || "",
          telefono: perfil.telefono || "",
          especialidad: perfil.especialidad?.id?.toString() || "",
        });
      } else {
        console.error("Error al obtener el perfil:", await res.text());
      }
    } catch (error) {
      console.error("Error de red al cargar perfil:", error);
    }
  }, []);

  // Carga especialidades
  const cargarEspecialidades = useCallback(async (usr) => {
    try {
      const token = await usr.getIdToken();
      const res = await fetch("http://localhost:8080/appMedica/rest/especialidades", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setListaEspecialidades(data);
      } else {
        console.error("Error al cargar especialidades:", await res.text());
      }
    } catch (error) {
      console.error("Error de red al cargar especialidades:", error);
    } finally {
      setCargandoEspecialidades(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (usr) => {
      if (usr) {
        setUser(usr);
        await cargarEspecialidades(usr);
        await cargarDatosDesdeBackend(usr);
      }
    });
    return () => unsubscribe();
  }, [auth, cargarEspecialidades, cargarDatosDesdeBackend]);

  // Validación cédula ecuatoriana
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

  // Validación teléfono (10 dígitos)
  const validarTelefono = (telefono) => /^\d{10}$/.test(telefono);

  // Maneja cambios de input
  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setDatos((prev) => ({ ...prev, [name]: value }));
  };

  // Guardar perfil con token y especialidad como objeto
  const guardarPerfil = async (e) => {
    e.preventDefault();
    const correo = auth.currentUser.email;

    if (!validarCedula(datos.cedula)) {
      alert("Cédula no válida.");
      return;
    }
    if (!validarTelefono(datos.telefono)) {
      alert("Teléfono no válido.");
      return;
    }

    const datosEnviar = {
      nombre: datos.nombre,
      cedula: datos.cedula,
      telefono: datos.telefono,
      especialidad: datos.especialidad ? { id: parseInt(datos.especialidad, 10) } : null,
    };

    try {
      const token = await user.getIdToken();
      const res = await fetch(`http://localhost:8080/appMedica/rest/usuarios/correo/${correo}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(datosEnviar),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Error al actualizar el perfil");
      }

      alert("Perfil actualizado correctamente");
    } catch (error) {
      console.error("Error al guardar perfil:", error);
      alert("Error al guardar perfil: " + error.message);
    }
  };

  const estilos = {
    pageContainer: { display: "flex", minHeight: "100vh" },
    sidebar: { width: "220px", backgroundColor: "#2b6cb0", color: "white", padding: "1rem" },
    logoMenu: { width: "100%", marginBottom: "2rem", cursor: "pointer" },
    mainConFondo: {
      flexGrow: 1,
      backgroundImage: `url(${fondoClinica})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      padding: "2rem",
    },
    contenedor: {
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      borderRadius: "8px",
      padding: "2rem",
      maxWidth: "600px",
      margin: "auto",
    },
    label: { display: "block", marginTop: "1rem", fontWeight: "bold" },
    input: { width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" },
    boton: {
      marginTop: "1.5rem",
      padding: "0.75rem 1.5rem",
      backgroundColor: "#2b6cb0",
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
    },
    menuItem: { marginBottom: "1rem", cursor: "pointer" },
  };

  return (
    <div style={estilos.pageContainer}>
      <div style={estilos.sidebar}>
        <img src={logo} alt="Logo" style={estilos.logoMenu} />
        <div style={estilos.menuItem} onClick={() => setVista("perfil")}>Perfil</div>
        <div style={estilos.menuItem} onClick={() => setVista("horarios")}>Agregar Horarios</div>
        <div style={estilos.menuItem} onClick={() => setVista("citas")}>Gestionar Citas</div>
        <Link to="/" style={{ color: "white" }}>Cerrar sesión</Link>
      </div>

      <div style={estilos.mainConFondo}>
        {vista === "perfil" && (
          <form onSubmit={guardarPerfil} style={estilos.contenedor}>
            <h2>Perfil del Administrador</h2>

            <label style={estilos.label}>Nombre:</label>
            <input
              style={estilos.input}
              type="text"
              name="nombre"
              value={datos.nombre}
              onChange={manejarCambio}
              required
            />

            <label style={estilos.label}>Cédula:</label>
            <input
              style={estilos.input}
              type="text"
              name="cedula"
              value={datos.cedula}
              onChange={manejarCambio}
              required
            />

            <label style={estilos.label}>Teléfono:</label>
            <input
              style={estilos.input}
              type="text"
              name="telefono"
              value={datos.telefono}
              onChange={manejarCambio}
              required
            />

            <label style={estilos.label}>Especialidad:</label>
            {cargandoEspecialidades ? (
              <p>Cargando especialidades...</p>
            ) : (
              <select
                style={estilos.input}
                name="especialidad"
                value={datos.especialidad}
                onChange={manejarCambio}
                required
              >
                <option value="">Seleccionar</option>
                {listaEspecialidades.map((esp) => (
                  <option key={esp.id} value={esp.id}>
                    {esp.nombreEspecialidad}
                  </option>
                ))}
              </select>
            )}

            <button type="submit" style={estilos.boton}>Guardar</button>
          </form>
        )}

        {vista === "horarios" && <AgregarHorario />}
        {vista === "citas" && <GestionarCitas />}
      </div>
    </div>
  );
};

export default AdministradorPagina;
