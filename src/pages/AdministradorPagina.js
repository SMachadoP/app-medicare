import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import AgregarHorario from "./AgregarHorario";
import GestionarCitas from "./GestionarCitas";
import logo from "../logoclinica.jpg";
import fondoClinica from "../fondoPaginaWeb.jpg";
import { Link } from "react-router-dom";

const AdministradorPerfil = () => {
  const [vista, setVista] = useState("perfil");
  const [datos, setDatos] = useState({
    nombre: "",
    cedula: "",
    telefono: "",
    especialidad: "",
  });
  const [listaEspecialidades, setListaEspecialidades] = useState([]);
  const [cargandoEspecialidades, setCargandoEspecialidades] = useState(true);
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    const cargarDatosDesdeBackend = async () => {
      if (user) {
        const token = await user.getIdToken();
        try {
          const res = await fetch("http://localhost:8080/appMedica/rest/usuarios", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (res.ok) {
            const perfil = await res.json();
            setDatos(perfil);
          } else {
            console.error("Error al obtener el perfil");
          }
        } catch (error) {
          console.error("Error de red:", error);
        }
      }
    };

    const cargarEspecialidades = async () => {
      try {
        const res = await fetch("http://localhost:8080/appMedica/rest/especialidades");
        if (res.ok) {
          const arr = await res.json();
          setListaEspecialidades(arr);
        } else {
          console.error("Error cargando especialidades");
        }
      } catch (error) {
        console.error("Error de red:", error);
      } finally {
        setCargandoEspecialidades(false);
      }
    };

    cargarDatosDesdeBackend();
    cargarEspecialidades();
  }, [user]);

  const manejarCambio = (e) => {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  };

  const guardarPerfil = async (e) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(datos.cedula)) {
      alert("La cédula debe tener 10 dígitos.");
      return;
    }
    if (!/^\d{10}$/.test(datos.telefono)) {
      alert("El teléfono debe tener 10 dígitos.");
      return;
    }

    try {
      const token = await user.getIdToken();
      const res = await fetch("http://localhost:8080/appmedica/rest/usuarios", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(datos),
      });
      if (res.ok) {
        alert("Perfil actualizado correctamente.");
      } else {
        alert("Error al guardar perfil.");
      }
    } catch (error) {
      console.error("Error de red al guardar perfil:", error);
    }
  };

  const estilos = {
    pageContainer: {
      display: "flex",
      minHeight: "100vh",
    },
    sidebar: {
      width: "220px",
      backgroundColor: "#2b6cb0",
      color: "white",
      padding: "1rem",
    },
    logoMenu: {
      width: "100%",
      marginBottom: "2rem",
      cursor: "pointer",
    },
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
    label: {
      display: "block",
      marginTop: "1rem",
      fontWeight: "bold",
    },
    input: {
      width: "100%",
      padding: "0.5rem",
      borderRadius: "4px",
      border: "1px solid #ccc",
    },
    boton: {
      marginTop: "1.5rem",
      padding: "0.75rem 1.5rem",
      backgroundColor: "#2b6cb0",
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
    },
    menuItem: {
      marginBottom: "1rem",
      cursor: "pointer",
    },
  };

  return (
    <div style={estilos.pageContainer}>
      <div style={estilos.sidebar}>
        <img src={logo} alt="Logo" style={estilos.logoMenu} />
        <div style={estilos.menuItem} onClick={() => setVista("perfil")}>
          Perfil
        </div>
        <div style={estilos.menuItem} onClick={() => setVista("horarios")}>
          Agregar Horarios
        </div>
        <div style={estilos.menuItem} onClick={() => setVista("citas")}>
          Gestionar Citas
        </div>
        <Link to="/" style={{ color: "white" }}>
          Cerrar sesión
        </Link>
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
            <select
              style={estilos.input}
              name="especialidad"
              value={datos.especialidad}
              onChange={manejarCambio}
              required
            >
              <option value="">Seleccionar</option>
              {listaEspecialidades.map((esp, idx) => (
                <option key={idx} value={esp}>
                  {esp}
                </option>
              ))}
            </select>
            <button type="submit" style={estilos.boton}>
              Guardar
            </button>
          </form>
        )}

        {vista === "horarios" && <AgregarHorario />}
        {vista === "citas" && <GestionarCitas />}
      </div>
    </div>
  );
};

export default AdministradorPerfil;