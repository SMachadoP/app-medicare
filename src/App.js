import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/LoginPagina";
import Administrador from "./pages/AdministradorPagina";
import Paciente from "./pages/PacientePagina";
import ReporteCitas from "./pages/ReporteCitas";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/Administrador" element={<Administrador />} />
        <Route path="/paciente" element={<Paciente />} />
        <Route path="/reportes" element={<ReporteCitas />} />
      </Routes>
    </Router>
  );
}

export default App;

