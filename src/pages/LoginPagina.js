// src/pages/Login.js

import React from "react";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { firebaseApp } from "../firebase";
import logo from "../logoclinica.jpg";
import fondoClinica from "../fondoPaginaWeb.jpg";

axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'true';

const LoginPagina = () => {
  const navigate = useNavigate();

  const API_BASE_URL = 'https://b2b642415388.ngrok-free.app/appMedica/rest';

// Luego modifica el handleLogin para usar esta constante:
const handleLogin = async () => {
  const auth = getAuth(firebaseApp);
  const provider = new GoogleAuthProvider();

  try {
    const result = await signInWithPopup(auth, provider);
    const email = result.user.email;
    const nombre = result.user.displayName || "";

    let usuarios = [];

    // Intentar obtener el usuario por correo
    try {
      const respuesta = await axios.get(
        `${API_BASE_URL}/usuarios/correo/${email}`,
        {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Accept': 'application/json'
          }
        }
      );
      
      console.log("Respuesta del servidor:", respuesta.data);
      
      // Verificar si es un error (objeto con status:"error")
      if (respuesta.data && respuesta.data.status === "error") {
        console.log("Usuario no encontrado, creando uno nuevo...");
        
        // Usuario no encontrado, se crea uno nuevo
        const nuevoUsuario = {
          nombre: nombre,
          correo: email,
          rol: "paciente",
          telefono: "0000000000", // Valor por defecto
          cedula: "0000000000"    // Valor por defecto
        };
        
        await axios.post(
          `${API_BASE_URL}/usuarios`, 
          nuevoUsuario,
          {
            headers: {
              'ngrok-skip-browser-warning': 'true',
              'Content-Type': 'application/json'
            }
          }
        );
        
        // Reintentar obtenerlo después de crearlo
        const nuevaRespuesta = await axios.get(
          `${API_BASE_URL}/usuarios/correo/${email}`,
          {
            headers: {
              'ngrok-skip-browser-warning': 'true',
              'Accept': 'application/json'
            }
          }
        );
        usuarios = nuevaRespuesta.data;
      } else {
        // Si no es error, asignar los usuarios
        usuarios = respuesta.data;
      }
      
    } catch (error) {
      console.error("Error al comunicarse con el backend:", error);
      alert("Error al comunicarse con el servidor: " + error.message);
      return;
    }

    // Verificar que tengamos usuarios
    if (!usuarios || !Array.isArray(usuarios) || usuarios.length === 0) {
      throw new Error("No se pudo obtener el usuario");
    }

    // Obtener el primer usuario del array
    const usuario = usuarios[0];
    console.log("Usuario obtenido:", usuario);

    // Obtener el rol
    const rolRaw = usuario.rol;
    console.log("Rol obtenido del backend:", rolRaw);
    
    if (!rolRaw) {
      console.error("Usuario completo:", usuario);
      throw new Error("El servidor no devolvió un campo 'rol' para el usuario");
    }
    
    const rol = rolRaw.toLowerCase();

    // Navegar según el rol
    if (rol === "admin" || rol === "administrador") {
      navigate("/Administrador");
    } else if (rol === "medico" || rol === "doctor") {
      navigate("/medico");
    } else {
      navigate("/paciente");
    }

  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    alert("Error al iniciar sesión: " + error.message);
  }
};

  const estilos = {
    pageContainer: {
      backgroundImage: `url(${fondoClinica})`,
      backgroundRepeat: "no-repeat",
      backgroundSize: "cover",
      backgroundPosition: "center center",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
    },
    header: {
      backgroundColor: "#2b6cb0",
      color: "white",
      padding: "1rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
    },
    logo: {
      position: "absolute",
      left: "1rem",
      height: "50px",
    },
    titulo: {
      margin: 0,
      fontSize: "1.5rem",
    },
    mainWrapper: {
      flexGrow: 1,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "2rem",
    },
    contenedorBlanco: {
      backgroundColor: "rgba(255,255,255,0.9)",
      borderRadius: "8px",
      width: "100%",
      maxWidth: "400px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      padding: "2rem",
      textAlign: "center",
    },
    boton: {
      backgroundColor: "#4285F4",
      color: "white",
      border: "none",
      padding: "0.75rem 1.5rem",
      borderRadius: "4px",
      fontSize: "1rem",
      cursor: "pointer",
    },
  };

  return (
    <div style={estilos.pageContainer}>
      <header style={estilos.header}>
        <img src={logo} alt="Logo" style={estilos.logo} />
        <h1 style={estilos.titulo}>Clínica San Sebastian</h1>
      </header>
      <main style={estilos.mainWrapper}>
        <div style={estilos.contenedorBlanco}>
          <h2>Iniciar sesión</h2>
          <button style={estilos.boton} onClick={handleLogin}>
            Iniciar sesión con Google
          </button>
        </div>
      </main>
    </div>
  );
};

export default LoginPagina;








