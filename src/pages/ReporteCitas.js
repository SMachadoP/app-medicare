// src/pages/ReporteCitas.jsx
import React, { useState } from "react";
import { getAuth } from "firebase/auth";

const API_BASE = "https://b2b642415388.ngrok-free.app/appMedica/rest";

export default function ReporteCitas() {
  const auth = getAuth();

  // filtros
  const [medicoNombre, setMedicoNombre] = useState("");
  const [espNombre, setEspNombre]       = useState("");
  const [desde, setDesde]               = useState("");
  const [hasta, setHasta]               = useState("");

  // datos obtenidos
  const [filas, setFilas]               = useState([]);
  const [cargando, setCargando]         = useState(false);
  const [error, setError]               = useState("");

  // 1) Mostrar tabla previa
  const cargarPreview = async () => {
    if (!medicoNombre || !espNombre || !desde || !hasta) {
      return alert("Por favor completa todos los filtros.");
    }

    setCargando(true);
    setError("");
    try {
      console.log("=== CARGANDO REPORTE ===");
      console.log("Parámetros:", { medicoNombre, espNombre, desde, hasta });
      
      const token = await auth.currentUser.getIdToken();
      const params = new URLSearchParams({
        medicoNombre,
        especialidadNombre: espNombre,
        desde,
        hasta
      });
      
      console.log("URL completa:", `${API_BASE}/reportes/citas/preview?${params}`);
      
      const res = await fetch(`${API_BASE}/reportes/citas/preview?${params}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json'
        }
      });
      
      console.log("Respuesta del servidor:", res.status, res.statusText);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error del servidor:", errorText);
        throw new Error(`Error ${res.status}: ${errorText}`);
      }
      
      const data = await res.json();
      console.log("Datos recibidos:", data);
      setFilas(data || []);
      
      if (!data || data.length === 0) {
        setError("No se encontraron datos para los filtros especificados.");
      }
    } catch (err) {
      console.error("Error completo:", err);
      setError(err.message);
      alert("Error al obtener datos de preview: " + err.message);
    } finally {
      setCargando(false);
    }
  };

  // 2) Descargar PDF con los mismos filtros
  const descargarPdf = async () => {
    if (filas.length === 0) {
      return alert("Primero genera la tabla previa antes de descargar PDF.");
    }

    try {
      console.log("=== DESCARGANDO PDF ===");
      const token = await auth.currentUser.getIdToken();
      const params = new URLSearchParams({
        medicoNombre,
        especialidadNombre: espNombre,
        desde,
        hasta
      });
      
      console.log("URL PDF:", `${API_BASE}/reportes/citas/pdf?${params}`);
      
      const res = await fetch(`${API_BASE}/reportes/citas/pdf?${params}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/pdf'
        }
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Error ${res.status}: ${errorText}`);
      }
      
      const blob = await res.blob();
      console.log("PDF blob creado, tamaño:", blob.size);
      
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `reporte_citas_${desde}_${hasta}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      
      console.log("PDF descargado exitosamente");
    } catch (err) {
      console.error("Error descargando PDF:", err);
      alert("Error al descargar el PDF: " + err.message);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 1000, margin: "auto" }}>
      <h1>Reporte de Citas</h1>
      <p style={{ color: "#666", marginBottom: "2rem" }}>
        Genera reportes de citas por médico y especialidad con nivel de ocupación.
      </p>

      {/* Formulario de filtros */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "1fr 1fr", 
        gap: 16, 
        marginBottom: 24,
        padding: "1.5rem",
        backgroundColor: "#f8f9fa",
        borderRadius: "8px",
        border: "1px solid #dee2e6"
      }}>
        <div>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "0.5rem" }}>
            Nombre del Médico:
          </label>
          <input
            type="text"
            value={medicoNombre}
            onChange={e => setMedicoNombre(e.target.value)}
            placeholder="Ej: Alejandro Machado"
            style={{ 
              width: "100%", 
              padding: "0.5rem",
              border: "1px solid #ced4da",
              borderRadius: "4px"
            }}
          />
          <small style={{ color: "#6c757d" }}>Nombre completo o parte del nombre</small>
        </div>
        
        <div>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "0.5rem" }}>
            Especialidad:
          </label>
          <input
            type="text"
            value={espNombre}
            onChange={e => setEspNombre(e.target.value)}
            placeholder="Ej: Pediatría"
            style={{ 
              width: "100%", 
              padding: "0.5rem",
              border: "1px solid #ced4da",
              borderRadius: "4px"
            }}
          />
          <small style={{ color: "#6c757d" }}>Nombre exacto de la especialidad</small>
        </div>
        
        <div>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "0.5rem" }}>
            Desde:
          </label>
          <input
            type="date"
            value={desde}
            onChange={e => setDesde(e.target.value)}
            style={{ 
              width: "100%", 
              padding: "0.5rem",
              border: "1px solid #ced4da",
              borderRadius: "4px"
            }}
          />
        </div>
        
        <div>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "0.5rem" }}>
            Hasta:
          </label>
          <input
            type="date"
            value={hasta}
            onChange={e => setHasta(e.target.value)}
            style={{ 
              width: "100%", 
              padding: "0.5rem",
              border: "1px solid #ced4da",
              borderRadius: "4px"
            }}
          />
        </div>
      </div>

      {/* Botones de acción */}
      <div style={{ marginBottom: "2rem" }}>
        <button 
          onClick={cargarPreview} 
          disabled={cargando}
          style={{
            padding: "0.75rem 2rem",
            backgroundColor: cargando ? "#6c757d" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: cargando ? "not-allowed" : "pointer",
            fontSize: "1rem",
            fontWeight: "bold",
            marginRight: "1rem"
          }}
        >
          {cargando ? "Cargando..." : "📊 Generar Reporte"}
        </button>
        
        {filas.length > 0 && (
          <button 
            onClick={descargarPdf}
            style={{
              padding: "0.75rem 2rem",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: "bold"
            }}
          >
            📄 Descargar PDF
          </button>
        )}
      </div>

      {/* Mensajes de error */}
      {error && (
        <div style={{
          backgroundColor: "#f8d7da",
          color: "#721c24",
          padding: "1rem",
          borderRadius: "4px",
          marginBottom: "2rem",
          border: "1px solid #f5c6cb"
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Tabla de resultados */}
      {filas.length > 0 && (
        <>
          <h2>Resultados del Reporte</h2>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{ 
                width: "100%", 
                borderCollapse: "collapse", 
                marginTop: 20,
                backgroundColor: "white",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
              }}
            >
              <thead style={{ backgroundColor: "#343a40", color: "white" }}>
                <tr>
                  <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #dee2e6" }}>
                    Médico
                  </th>
                  <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #dee2e6" }}>
                    Especialidad
                  </th>
                  <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #dee2e6" }}>
                    Total Citas
                  </th>
                  <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #dee2e6" }}>
                    Total Horarios
                  </th>
                  <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #dee2e6" }}>
                    % Ocupación
                  </th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f, i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#f8f9fa" : "white" }}>
                    <td style={{ padding: "12px", borderBottom: "1px solid #dee2e6" }}>
                      {f.medico}
                    </td>
                    <td style={{ padding: "12px", borderBottom: "1px solid #dee2e6" }}>
                      {f.especialidad}
                    </td>
                    <td style={{ padding: "12px", textAlign: "center", borderBottom: "1px solid #dee2e6" }}>
                      <span style={{
                        backgroundColor: "#e3f2fd",
                        color: "#1976d2",
                        padding: "4px 8px",
                        borderRadius: "12px",
                        fontWeight: "bold"
                      }}>
                        {f.totalCitas}
                      </span>
                    </td>
                    <td style={{ padding: "12px", textAlign: "center", borderBottom: "1px solid #dee2e6" }}>
                      <span style={{
                        backgroundColor: "#f3e5f5",
                        color: "#7b1fa2",
                        padding: "4px 8px",
                        borderRadius: "12px",
                        fontWeight: "bold"
                      }}>
                        {f.totalHorarios}
                      </span>
                    </td>
                    <td style={{ padding: "12px", textAlign: "center", borderBottom: "1px solid #dee2e6" }}>
                      <span style={{
                        backgroundColor: f.ocupacionPct >= 80 ? "#d4edda" : 
                                        f.ocupacionPct >= 50 ? "#fff3cd" : "#f8d7da",
                        color: f.ocupacionPct >= 80 ? "#155724" : 
                               f.ocupacionPct >= 50 ? "#856404" : "#721c24",
                        padding: "4px 8px",
                        borderRadius: "12px",
                        fontWeight: "bold"
                      }}>
                        {f.ocupacionPct}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Resumen estadístico */}
          <div style={{
            marginTop: "2rem",
            padding: "1.5rem",
            backgroundColor: "#e9ecef",
            borderRadius: "8px",
            border: "1px solid #ced4da"
          }}>
            <h3 style={{ marginTop: 0 }}>📈 Resumen Estadístico</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#007bff" }}>
                  {filas.reduce((sum, f) => sum + f.totalCitas, 0)}
                </div>
                <div style={{ color: "#6c757d" }}>Total de Citas</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#6f42c1" }}>
                  {filas.reduce((sum, f) => sum + f.totalHorarios, 0)}
                </div>
                <div style={{ color: "#6c757d" }}>Total de Horarios</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#28a745" }}>
                  {filas.length > 0 ? 
                    Math.round(filas.reduce((sum, f) => sum + f.ocupacionPct, 0) / filas.length) : 0}%
                </div>
                <div style={{ color: "#6c757d" }}>Ocupación Promedio</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Información de ayuda */}
      <div style={{
        marginTop: "3rem",
        padding: "1rem",
        backgroundColor: "#d1ecf1",
        borderRadius: "4px",
        border: "1px solid #bee5eb"
      }}>
        <h4 style={{ color: "#0c5460", marginTop: 0 }}>💡 Información sobre el Reporte</h4>
        <ul style={{ color: "#0c5460", margin: 0 }}>
          <li><strong>Total Citas:</strong> Número de citas agendadas en el período seleccionado</li>
          <li><strong>Total Horarios:</strong> Número de horarios disponibles del médico</li>
          <li><strong>% Ocupación:</strong> Porcentaje de horarios ocupados con citas</li>
          <li><strong>Colores:</strong> Verde (≥80%), Amarillo (≥50%), Rojo (&lt;50%)</li>
        </ul>
      </div>
    </div>
  );
}