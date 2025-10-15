import usuario from "../assets/usuario.png";
import {
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import Configuracion from "./Modulos/Configuracion";
import Metricas from "./Modulos/Metricas";
import "./VentanaC.css";
import Menu from "./Modulos/Menu";
import Insumos from "./Modulos/Insumos";
import Pagos from "./Modulos/Pagos";
import Pedidos_Aplicativo from "./Modulos/Pedidos_Aplicativo";
import Pedidos_Fisicos from "./Modulos/PedidosVista";
import Usuario from "./Modulos/Usuario";
import Mesas from "./Modulos/Mesas";
import comida from "../assets/comida.png";
function Admin() {
  const navigate = useNavigate();
  const ubicacion = useLocation();
  const retroceder = () => {
    navigate("/Login");
  };
  const estaActivo = (ruta) => {
    return ubicacion.pathname === ruta ? "active" : "";
  };
  return (
    <>
      <div className="layout">
        {/*Barra de menú*/}
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
              src={usuario}
              alt="Usuario"
              className="rounded-circle mb-2 usuario"
            />
            <h6 className="m-0 text-white">Salvador Goicochea</h6>
            <h6 className="text-white">Administrador</h6>
          </div>
          <ul className="nav nav-pills flex-column mb-0">
            <li>
              <Link
                to="/admin/Metricas"
                className={`nav-link ${estaActivo("/admin/Metricas")}`}
              >
                <i className="bi bi-bar-chart me-2"></i>Métricas
              </Link>
            </li>
            <li>
              <Link
                to="/admin/Configuracion"
                className={`nav-link ${estaActivo("/admin/Configuracion")}`}
              >
                <i className="fa-solid fa-gear"></i>Configuracion
              </Link>
            </li>
            <li>
              <Link
                to="/admin/Menu"
                className={`nav-link ${estaActivo("/admin/Menu")}`}
              >
                <i className="fa-solid fa-utensils me-2"></i>Menu
              </Link>
            </li>
            <li>
              <Link
                to="/admin/Mesas"
                className={`nav-link ${estaActivo("/admin/Mesas")}`}
              >
                <i className="fa-solid fa-table"></i>Mesas
              </Link>
            </li>
            <li>
              <Link
                to="/admin/Pedidos_Fisicos"
                className={`nav-link ${estaActivo("/admin/Pedidos_Fisicos")}`}
              >
                <i className="bi bi-ticket me-2"></i>Pedidos Físicos
              </Link>
            </li>
            <li>
              <Link
                to="/admin/Pedidos_Aplicativo"
                className={`nav-link ${estaActivo(
                  "/admin/Pedidos_Aplicativo"
                )}`}
              >
                <i className="bi bi-window me-2"></i>Pedidos por Aplicativo
              </Link>
            </li>
            <li>
              <Link
                to="/admin/Insumos"
                className={`nav-link ${estaActivo("/Admin/Insumos")}`}
              >
                <i className="bi bi-clipboard me-2"></i>Insumos
              </Link>
            </li>
            <li>
              <Link
                to="/admin/Pagos"
                className={`nav-link ${estaActivo("/admin/Pagos")}`}
              >
                <i className="bi bi-cash-coin me-2"></i>Pagos
              </Link>
            </li>
            <li>
              <Link
                to="/admin/Usuario"
                className={`nav-link ${estaActivo("/admin/Usuario")}`}
              >
                <i className="bi bi-people me-2"></i>Usuarios
              </Link>
            </li>
          </ul>
        </aside>
        {/*Parte principal*/}
        <div className="main">
          <header className="app-header d-flex align-items-center shadow">
            {/*Bloque superior*/}
            <div className="header-inner d-flex align-items-center gap-2 ms-auto">
              {/*Notificaciones*/}
              <div className="action">
                <button className="btn-icon" aria-label="Notificaciones">
                  <i className="fa-solid fa-bell"></i>
                  <span className="badge-dot"></span>
                </button>
              </div>
              <div className="vr mx-auto"></div>
              {/*Avatar*/}
              <div className="action">
                <img
                  src={usuario}
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
                <Route path="Configuracion" element={<Configuracion />} />
                <Route path="Metricas" element={<Metricas />} />
                <Route path="Menu" element={<Menu />} />
                <Route path="Mesas" element={<Mesas />} />
                <Route path="Pedidos_Fisicos" element={<Pedidos_Fisicos />} />
                <Route
                  path="Pedidos_Aplicativo"
                  element={<Pedidos_Aplicativo />}
                />
                <Route path="Insumos" element={<Insumos />} />
                <Route path="Pagos" element={<Pagos />} />
                <Route path="Usuario" element={<Usuario />} />
                <Route path="*" element={<Pedidos_Aplicativo />} />
                {/* Ruta por defecto */}
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
export default Admin;
