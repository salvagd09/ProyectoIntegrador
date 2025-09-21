import usuario from "../assets/usuario.png";
import "./tarjetas.css";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import "./VentanaC.css";
import Menu from "./Modulos/Menu";
import Pedidos_Aplicativo from "./Modulos/Pedidos_Aplicativo";
import Pedidos_Fisicos from "./Modulos/Pedidos_Fisicos";
import Usuario from "./Modulos/Usuario";
import comida from "../assets/comida.png";
function Admin() {
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
        <input type="checkbox" id="nav-toggle" className="d-none" />
        {/*Barra superior en mobile con botón hamburguesa*/}
        <header className="d-md-none position-sticky top-0 z-3 text-white">
          <label
            htmlFor="nav-toggle"
            className="btn btn-link text-dark m-2 p-0"
          >
            <i className="bi bi-list" style={{ fontSize: "1.75rem" }}></i>
          </label>
        </header>
        {/*Tu sidebar (SIN JS)*/}
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
                to="/admin/MétricasYConfiguracion"
                className={`nav-link ${estaActivo(
                  "/admin/MétricasYConfiguracion"
                )}`}
              >
                <i className="bi bi-bar-chart me-2"></i>Métricas y configuración
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
                <i className="bi bi-window me-2"></i>Pedidos Virtuales
              </Link>
            </li>
            <li>
              <Link
                to="/admin/Insumos"
                className={`nav-link ${estaActivo("/Admin/Insumos")}`}
              >
                <i className="bi bi-cash-coin me-2"></i>Insumos
              </Link>
            </li>
            <li>
              <Link
                to="/admin/Pagos"
                className={`nav-link ${estaActivo("/admin/Pagos")}`}
              >
                <i className="bi bi-compass me-2"></i>Pagos
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
        {/*Columna derecha */}
        <div className="main">
          <header className="app-header d-flex align-items-center shadow">
            {/*Si quieres algo a la izquierda, iría aquí 
         Bloque de acciones al lado derecho*/}
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
                <Route path="Dashboard" element={<Dashboard />} />
                <Route path="menu" element={<Menu />} />
                <Route path="Pedidos_Fisicos" element={<Pedidos_Fisicos />} />
                <Route
                  path="pedidos_Aplicativo"
                  element={<Pedidos_Aplicativo />}
                />
                <Route path="Ventas" element={<Ventas />} />
                <Route path="GestorC" element={<GestorC />} />
                <Route path="Usuario" element={<Usuario />} />
                <Route path="/" element={<Dashboard />} />
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
