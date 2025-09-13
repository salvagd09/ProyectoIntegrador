import { Routes, Route } from "react-router-dom";
import Login from "./Components/Login";
import Admin from "./Components/Admin";
import Cajero from "./Components/Cajero";
import Mesero from "./Components/Mesero";
import Cocinero from "./Components/Cocinero";

function Main() {
  return (
    <Routes>
      {/* Ruta pública - Login */}
      <Route path="/" element={<Login />} />

      {/* Rutas protegidas por rol */}
      <Route path="/admin/*" element={<Admin />} />

      <Route path="/cajero/*" element={<Cajero />} />

      <Route path="/mesero/*" element={<Mesero />} />

      <Route path="/cocinero/*" element={<Cocinero />} />

      {/* Ruta por defecto */}
      <Route path="*" element={<div>Página no encontrada</div>} />
    </Routes>
  );
}

export default Main;
