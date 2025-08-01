Guía Rápida – App de Citas Médicas 🏥 (Versión 2.0)

Link de producción: https://appmedica-9a1c9.web.app/

---

## 1. Ingreso a la App 🔑
1. Abre tu navegador e ingresa la URL de la aplicación.  
2. Haz clic en **“Iniciar sesión con Google”**.  
   - Si tu rol es **paciente**, irás al **Panel de Paciente**.  
   - Si tu rol es **administrador/médico**, irás al **Panel de Administrador**.

---

## 2. Panel de Paciente 👩‍⚕️

### 2.1 Menú Lateral 🗂️
- **Mi Perfil** 👤  
- **Solicitar Cita** 🗓️  
- **Mis Citas** 📋  

### 2.2 Mi Perfil 👤
1. Completa/actualiza:
   - Nombre completo  
   - Cédula  
   - Teléfono  
   - Dirección  
   - Género  
2. Presiona **“Guardar Cambios”** 💾.  
3. Verás: **“Perfil actualizado correctamente”** ✅.  

---

### 2.3 Solicitar Cita 🗓️
1. Ve a **Solicitar Cita**.  
2. Selecciona:
   - **Especialidad** (e.g. Cardiología)  
   - **Médico** disponible  
   - **Horario** libre  
3. Haz clic en **“Agendar Cita”** 📩.  
4. Mensaje: **“¡Cita agendada con éxito!”** 🎉.  
5. Ese turno pasa a **ocupado**.

---

### 2.4 Mis Citas 📋
1. Abre **Mis Citas** para ver:
   - 🩺 Especialidad  
   - 👨‍⚕️ Doctor  
   - 📅 Fecha y Hora  
   - 📌 Estado:  
     - 🔵 Pendiente  
     - ✅ Confirmada  
     - ❌ Negada  
2. **Filtros** (historial):
   - Fecha “Desde” / “Hasta”  
   - Especialidad  
   - Estado  
3. Para **cancelar** (si Pendiente/Confirmada):
   - Pulsa **“Cancelar Cita”** 🗑️ → confirma.  
   - La cita se elimina y el turno se libera 🔄.

---

### 2.5 Recordatorios 🔔
- Cuando el médico **confirma**, el estado cambia a Confirmada.  
- Recibirás aviso (correo/WhatsApp simulado)  
  **24 h antes** y **horas previas** a la cita.

---

## 3. Panel de Administrador/Médico 👨‍⚕️

### 3.1 Menú Lateral 🗂️
- **Mi Perfil** 👤  
- **Agregar Horario** 📆  
- **Gestión de Citas** 📋  
- **Reportes** 📊  

### 3.2 Mi Perfil 👤
1. Completa/actualiza:
   - Nombre  
   - Cédula  
   - Teléfono  
   - Especialidad  
2. Haz clic en **“Guardar Cambios”** 💾 → **“Perfil actualizado correctamente”** ✅.

---

### 3.3 Agregar Horario 📆
1. Entra a **Agregar Horario**.  
2. Opciones:
   - **Generar franjas** por defecto  
   - **Crear manual**: elige fecha/hora → “Guardar Horario” 💾  
3. Mensaje: **“¡Horario agregado con éxito!”** 🎉.  

---

### 3.4 Gestión de Citas 📋
1. Accede a **Gestión de Citas**.  
2. Cada fila muestra:
   - 👤 Paciente  
   - 📅 Fecha y Hora  
   - 📌 Estado Actual  
3. Desplegable para cambiar a:  
   - ✅ Confirmada → cita aceptada  
   - ❌ Negada → cita rechazada + libera horario 🔄  
4. Confirmar/Negar actualiza instantáneamente ambos lados.

---

### 3.5 Reportes 📊
1. Ve a **Reportes**.  
2. Filtra por:
   - Nombre de Médico  
   - Especialidad  
   - Fecha “Desde” / “Hasta”  
3. **Generar Vista Previa**: tabla con  
   - Total Citas  
   - Total Horarios  
   - % Ocupación  
4. **Descargar**:
   - 📄 **PDF**  
   - 📑 **Excel**  
5. Usa informes para calibrar carga y disponibilidad.

---

## 4. Ajustes de Interfaz y Móvil 📱
- Diseño responsivo: sidebar colapsa en menú hamburguesa.  
- Formularios adaptados a pantallas pequeñas.  
- Botones grandes y feedback táctil.

---

## 5. Despliegue y Herramientas 🚀
- **Backend**: Jakarta EE (WildFly) o Spring Boot + PostgreSQL + REST API  
- Durante desarrollo: expón con **ngrok**  
- **Frontend**: React + Firebase Hosting (HTTPS automático)  
- Ajusta `ngrok-skip-browser-warning` en peticiones al API.

---

## 6. Cierre de Sesión y Seguridad 🔒
- Cierra la pestaña o usa “Cerrar sesión” en menú.  
- Autenticación segura con Google OAuth2.  
- No se almacenan contraseñas locales.

---

## 7. Resumen Final ✅

**Para Pacientes**  
1. Login Google → completa perfil → solicita y gestiona citas → recibe recordatorios.  

**Para Administradores/Médicos**  
1. Login Google → configura perfil → añade horarios → gestiona solicitudes → analiza reportes.  

¡Listo! Con estos pasos aprovechas al máximo la versión 2.0 de la App de Citas Médicas. 😊

© 2025 Clínica San Sebastián.  
