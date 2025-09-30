import mesero from "../assets/mesero.png";
import "./VentanaC.css";
import comida from "../assets/comida.png";
import Mesas from "./Modulos/Mesas";
import Pedidos_Fisicos from "./Modulos/Pedidos_Fisicos";
import { Routes, Route, Link, useLocation } from "react-router-dom";
function Mesero() {
  const ubicacion = useLocation();
  const estaActivo = (ruta) => {
    return ubicacion.pathname === ruta ? "active" : "";
  };
  return (
    <>
      <div className="layout">
        {/*Barra del menú*/}
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
              src={mesero}
              alt="Mesero"
              className="rounded-circle mb-2 usuario"
            />
            <h6 className="m-0 text-white">Área de meseros</h6>
          </div>
          <ul className="nav nav-pills flex-column mb-0">
            <li>
              <Link
                to="/mesero/Mesas"
                className={`nav-link ${estaActivo("/mesero/Mesas")}`}
              >
                <i className="fa-solid fa-utensils me-2"></i>Mesas
              </Link>
            </li>
            <li>
              <Link
                to="/mesero/Pedidos_Fisicos"
                className={`nav-link ${estaActivo("/mesero/Pedidos_Fisicos")}`}
              >
                <i className="bi bi-ticket me-2"></i>Pedidos Físicos
              </Link>
            </li>
          </ul>
        </aside>
        {/*Página principal */}
        <div className="main">
          <header className="app-header d-flex align-items-center shadow">
            {/*Encabezado del lado principal*/}
            <div className="header-inner d-flex align-items-center gap-2 ms-auto">
              {/*Avatar*/}
              <div className="action">
                <img
                  src={mesero}
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
                <Route path="Mesas" element={<Mesas />} />
                <Route path="Pedidos_Fisicos" element={<Pedidos_Fisicos />} />
                <Route path="/" element={<Pedidos_Fisicos />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
export default Mesero;
