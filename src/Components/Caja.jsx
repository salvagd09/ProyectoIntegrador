import comida from "../assets/comida.png";
import "./VentanaC.css";
import {
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import cajero from "../assets/cajero.png";
import Pagos from "./Modulos/Pagos";

function Cajero() {
  const navigate = useNavigate();
  const ubicacion = useLocation();

  const estaActivo = (ruta) => {
    return ubicacion.pathname === ruta ? "active" : "";
  };

  const retroceder = () => {
    navigate("/Login");
  };

  return (
    <>
      <div className="layout">
        {/* Barra de menú */}
        <aside id="sidebar" className="d-flex flex-column p-3 text-dark">
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

          {/* Perfil de usuario */}
          <div className="text-center mb-0">
            <img
              src={cajero}
              alt="Cajero"
              className="rounded-circle mb-2 usuario"
            />
            <h6 className="m-0 text-white">Salvador Goicochea</h6>
            <h6 className="text-white">Área de caja</h6>
          </div>

          <ul className="nav nav-pills flex-column mb-0">
            <li>
              <Link
                to="/caja/Pagos"
                className={`nav-link ${estaActivo("/caja/Pagos")}`}
              >
                <i className="bi bi-window me-2"></i>Pagos
              </Link>
            </li>
          </ul>
        </aside>

        {/* Columna derecha */}
        <div className="main">
          <header className="app-header d-flex align-items-center shadow">
            {/* Si quieres algo a la izquierda, iría aquí */}
            {/* Bloque de acciones al lado derecho */}
            <div className="header-inner d-flex align-items-center gap-2 ms-auto">
              {/* Notificaciones */}
              <div className="action">
                <button className="btn-icon" aria-label="Notificaciones">
                  <i className="fa-solid fa-bell"></i>
                  <span className="badge-dot"></span>
                </button>
              </div>

              <div className="vr mx-auto"></div>

              {/* Avatar */}
              <div className="action">
                <img
                  src={cajero}
                  alt="Usuario"
                  className="rounded-circle usuario2"
                />
              </div>

              <div className="vr mx-auto"></div>

              {/* Salir */}
              <div className="action">
                <form>
                  <button
                    type="submit"
                    onClick={retroceder}
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
                <Route path="Pagos" element={<Pagos />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

export default Cajero;
