import comida from "../assets/comida.png";
import cocinero from "../assets/cocinero.png";
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
        {/*Barra de menú)*/}
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
                <i className="bi bi-box2 me-2"></i>Insumos
              </Link>
            </li>
          </ul>
        </aside>
        {/*Columna derecha */}
        <div className="main">
          <header className="app-header d-flex align-items-center shadow">
            {/*Encabezado del lado principal*/}
            <div className="header-inner d-flex align-items-center gap-2 ms-auto">
              {/*Avatar*/}
              <div className="action">
                <img
                  src={cocinero}
                  alt="Usuario"
                  className="rounded-circle usuario2"
                />
              </div>
              <div className="vr mx-auto"></div>
              {/*Salir */}
              <div className="action">
                <form>
                  <button
                    type="submit"
                    className="btn-icon"
                    aria-label="Cerrar sesión"
                  >
                    <i className="fa-solid fa-right-from-bracket"></i>
                  </button>
                </form>
              </div>
            </div>
          </header>
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
