// src/pages/Login.js

import React from "react";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { firebaseApp } from "../firebase";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import logo from "../logoclinica.jpg";
import fondoClinica from "../fondoPaginaWeb.jpg";

function LoginPagina() {
  const navigate = useNavigate();

  const handleLogin = async () => {
    const auth = getAuth(firebaseApp);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email;

      // Usar GET según tu backend
      const respuesta = await axios.get(`http://localhost:8080/appMedica/rest/usuarios/correo/${email}`);
      const usuarios = respuesta.data;

      if (usuarios.length === 0) {
        alert("No se encontró un usuario registrado con ese correo.");
        return;
      }

      const rol = usuarios[0].rol.toLowerCase();

      if (rol === "admin" || rol === "administrador") {
        navigate("/Administrador");
      } else {
        navigate("/paciente");
      }

    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      alert("Error al iniciar sesión con Google o al consultar el rol del usuario.");
    }
  };

  const estilos = {
    pageContainer: {
      backgroundImage: `url(${fondoClinica})`, // ← CORREGIDO aquí
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
}

export default LoginPagina;






