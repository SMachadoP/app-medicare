import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../firebase";

// Función que se comunica con tu backend en Java
async function registrarUsuarioEnBackend(user) {
  const response = await fetch("http://localhost:8080/appMedica/rest/usuarios", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      uid: user.uid,
      nombre: user.displayName,
      email: user.email
    })
  });

  if (!response.ok) {
    throw new Error("Error al registrar/consultar usuario en el backend");
  }

  const data = await response.json();
  return data.rol;
}

// Función principal de login
export async function loginConGoogle() {
  try {
    const resultado = await signInWithPopup(auth, provider);
    const user = resultado.user;

    const rol = await registrarUsuarioEnBackend(user);

    return { user, rol };
  } catch (error) {
    console.error("Error al iniciar sesión con Google o al comunicar con el backend:", error);
    throw error;
  }
}

