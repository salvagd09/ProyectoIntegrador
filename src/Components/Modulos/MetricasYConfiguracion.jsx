import { Routes, Route, Link } from "react-router-dom";
import Configuracion from "./Configuracion";
import Metricas from "./Metricas";
function MetricasYConfiguracion() {
  return (
    <>
      <div>
        <h1>Metricas y Configuración</h1>
        <div className="container">
          <Link to="/Configuracion" className="tab">
            Configuración
          </Link>
          <Link to="/Metricas" className="tab">
            Métricas
          </Link>
        </div>
        <div className="container principal">
          <Routes>
            <Route path="/Configuracion" element={<Configuracion />} />
            <Route path="/Metricas" element={<Metricas />} />
          </Routes>
        </div>
      </div>
    </>
  );
}
export default MetricasYConfiguracion;
