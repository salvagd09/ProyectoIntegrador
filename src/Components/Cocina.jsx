import comida from "../assets/comida.png";
import cocinero from "../assets/cocinero.png";
import "./tarjetas.css";
import "./VentanaC.css";
import Pedidos_Cocinero from "./Modulos/Pedidos_Cocinero";
import Insumos from "./Modulos/Insumos";
import { Routes, Route, Link, useLocation } from "react-router-dom";
function Cocinero() {
  const ubicacion = useLocation();
  const estaActivo = (ruta) => {
    return ubicacion.pathname === ruta ? "active" : "";
  };
  return (
    <>
      <div className="layout">
        {/*Sidebar a la izquierda 
             Toggle (solo mobile) */}
        <label htmlFor="nav-toggle" style={{ display: "none" }}>
          A
        </label>
        <input type="checkbox" id="na-toggle" className="d-none" />
        {/*Barra superior en mobile con botón hamburguesa*/}
        <header className="d-md-none position-sticky top-0 z-3 text-white">
          <label
            htmlFor="nav-toggle"
            className="btn btn-link text-dark m-2 p-0"
          >
            <i className="bi bi-list" style={{ fontSize: "1.75rem" }}></i>
          </label>
        </header>
        {/*El sidebar (SIN JS)*/}
        <aside id="sidebar" className="d-flex flex-column p-3  text-dark">
          <div className="d-flex align-items-center justify-content-center">
            <a
              href="index.html"
              className="d-flex align-items-center text-decoration-none text-white"
            >
              <img
                src={comida}
                alt="Logo EstilosPE"
                style={{ width: "50px" }}
                className="me-2"
              />
              <h3 className="m-0">GestaFood</h3>
            </a>
          </div>
          {/*Perfil de usuario */}
          <div className="text-center mb-0">
            <img
              src={cocinero}
              alt="Cocinero"
              className="rounded-circle mb-2 usuario"
            />
            <h6 className="text-white">Área de cocina</h6>
          </div>
          <ul className="nav nav-pills flex-column mb-0">
            <li>
              <Link
                to="/cocina/Pedidos_Cocinero"
                className={`nav-link ${estaActivo("/cocina/Pedidos_Cocinero")}`}
              >
                <i className="bi bi-ticket  me-2"></i>Pedidos
              </Link>
            </li>
            <li>
              <Link
                to="/cocina/Insumos"
                className={`nav-link ${estaActivo("/cocina/Insumos")}`}
              >
                <i className="bi bi-box2 me-2">Insumos</i>
              </Link>
            </li>
          </ul>
        </aside>
        {/*Columna derecha */}
        <div className="main">
          <main className="app-content">
            <div id="page-content-wrapper" className="p-4 flex-grow-1">
              <Routes>
                <Route path="Insumos" element={<Insumos />} />
                <Route path="Pedidos_Cocinero" element={<Pedidos_Cocinero />} />
                <Route path="/" element={<Pedidos_Cocinero />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
export default Cocinero;
