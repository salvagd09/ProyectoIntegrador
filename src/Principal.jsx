import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./Components/Login";
import Admin from "./Components/Admin";
import Caja from "./Components/Caja";
import Cocina from "./Components/Cocina";
import Mesero from "./Components/Mesero";
function Main() {
  return (
    <Routes>
      {/* Ruta pública - Login */}
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin/*" element={<Admin />} />
      <Route path="/mesero/*" element={<Mesero />} />
      <Route path="/caja/*" element={<Caja />} />
      <Route path="/cocina/*" element={<Cocina />} />
      <Route path="*" element={<div>Página no encontrada</div>} />
    </Routes>
  );
}
export default Main;
