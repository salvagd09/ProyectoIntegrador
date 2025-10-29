import React, { useState, useEffect } from "react";
import comida from "../assets/comida.png";

import {
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import usuario from "../assets/cocinero.png";

import Pedidos_Cocinero from "./Modulos/Pedidos_Cocinero";
import Insumos from "./Modulos/Insumos";

import styles from './Admin.module.css';

const ROL_MAP = {
    4: "Administrador",
    1: "Mesero",
    2: "Cocinero",
    3: "Cajero",
};

function Cocinero() {
  const navigate = useNavigate();
    const ubicacion = useLocation();

    // Constante para abrir/cerrar sidebar
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const [userData, setUserData] = useState({
        id: null,
        nombre: "",
        apellido: "", 
        rolId: null,
        rolNombre: "",
        email: "",
        activo: true,
    });

    // Constante para fecha
    const [currentDate, setCurrentDate] = useState("");

    useEffect(() => {
        // Cargar fecha actual
        const date = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        setCurrentDate(date.toLocaleDateString('es-ES', options));

        loadUserData();
    }, []); 

    const loadUserData = () => {
        const savedUserData = localStorage.getItem('userData');
        if (savedUserData) {
            const userDataFromStorage = JSON.parse(savedUserData);
            setUserData({
                id: userDataFromStorage.id,
                nombre: userDataFromStorage.nombre,
                apellido: userDataFromStorage.apellido,
                rolId: userDataFromStorage.rol_id,
                rolNombre: userDataFromStorage.rol_nombre,
                email: userDataFromStorage.email,
                activo: true
            });
        } else {
            setUserData({
                id: null,
                nombre: "Usuario",
                apellido: "Cocina", 
                rolId: 2,
                rolNombre: "Cocinero",
                email: "",
                activo: true
            });
        }
    };
    // Estilos
    const sidebarStyle = {
        backgroundColor: 'var(--color-header)',
        color: 'var(--color-text)',
        borderColor: 'var(--color-accent)',
        borderRight: '1px solid var(--color-muted)',
    };

    const headerStyle = {
        backgroundColor: 'var(--color-header)',
        color: 'var(--color-text)',
    };

    const logoTitleStyle = {
        color: 'var(--color-title)',
        fontFamily: 'var(--font-title)',
        fontSize: '1.8rem'
    };

    const linkStyle = {
        color: 'var(--color-text)',
    };

    const getRoleName = (id) => ROL_MAP[id] || "Desconocido";

    const retroceder = () => {
        const savedUserData = localStorage.getItem('userData');
        // Solo limpiar si hay una sesión activa
        if (savedUserData) {
            localStorage.removeItem('userData');
            localStorage.removeItem('userRole');
            localStorage.removeItem('isAuthenticated');
        }
        navigate("/Login");
    }

    const estaActivo = (ruta) => {
        return ubicacion.pathname === ruta ? styles.activeLink : styles.navLinkBase;
    };

    const sidebarWidth = isSidebarOpen ? '325px' : '90px';

    const headerStyleCalculated = {
        ...headerStyle,
        left: sidebarWidth,
        width: `calc(100% - ${sidebarWidth})`,
    };

    const headerWidth = `calc(100% - ${sidebarWidth})`;

    return (
        <div className={styles.layout}>
            {/* Sidebar */}
            <aside 
                id="sidebar" 
                className={`d-flex flex-column p-3`} 
                style={{ ...sidebarStyle, width: sidebarWidth }}
                data-open={isSidebarOpen}
            >
                
            {/* Logo y título de la página */}
            <div className="d-flex align-items-center justify-content-center pt-4 pb-4 border-bottom" style={{borderColor: 'var(--color-muted)'}}>
                <a href="#" className="d-flex align-items-center text-decoration-none" style={{color: 'var(--color-title)'}}>
                <img
                    src={comida}
                    alt="Logo de GestaFood"
                    className={`me-2 ${styles.logoImg}`}
                />
                {isSidebarOpen && <h3 className="m-0" style={logoTitleStyle}>GestaFood</h3>}
                </a>
            </div>

            {/* Módulos de la página */}
            <div className={styles.modulesContainer}>
                <ul className={`nav nav-pills flex-column mb-auto align-content-center`}>
                    <li className="nav-item w-100"> 
                        <Link to="/cocina/Pedidos_Cocinero" className={`nav-link ${estaActivo("/cocina/Pedidos_Cocinero")}`} style={linkStyle}>
                            <i className="bi bi-ticket me-2"></i>{isSidebarOpen && "Pedidos"}
                        </Link>
                    </li>
                    <li>
                        <Link to="/cocina/Insumos" className={`nav-link ${estaActivo("/cocina/Insumos")}`} style={linkStyle}>
                            <i className="bi bi-box-seam me-2"></i>{isSidebarOpen && "Insumos"}
                        </Link>
                    </li>
                    
                </ul>
            </div>

            {/* Perfil de usuario */}
            <div className={`${styles.profileContainer}`} style={{borderColor: 'var(--color-muted)'}}>
                <div className={`d-flex flex-column align-items-center ${isSidebarOpen ? '' : 'justify-content-center'}`}>
                    {/* Avatar */}
                    <img
                        src={usuario}
                        alt="Usuario"
                        className={`ms-2 me-2 mb-2 ${styles.profileAvatar}`}
                        style={{ border: `2px solid var(--color-accent)`, filter: `invert(1)` }}
                    />
                    {/* Info de Usuario */}
                    {isSidebarOpen &&   (
                    <div style={{ lineHeight: 1.2 }}>
                        <h6 className="m-0" style={{ color: 'var(--color-title)' }}>
                            {userData.nombre} {userData.apellido}
                        </h6>
                        <span className="small d-flex align-items-center" style={{ color: 'var(--color-muted)' }}>
                            {userData.rolNombre || getRoleName(userData.rolId)}
                            <span className={`${styles['status-indicator']} ms-2 ${userData.activo ? styles['status-online'] : styles['status-offline']}`}></span>
                        </span>
                    </div>
                    )}
                    {/* Botón de Cerrar Sesión */}
                    <button 
                        onClick={retroceder}
                        className={`btn w-100 d-flex align-items-center justify-content-center ${styles.logoutBtn}`}
                        style={{
                            backgroundColor: 'var(--color-btn-delete)',
                            color: 'white', 
                            borderColor: 'var(--color-btn-delete)',
                            fontWeight: '500',
                            marginTop: '1rem'
                        }}
                    > 
                        <i className="fa-solid fa-right-from-bracket align-content-center ms-2 me-2"></i>
                        {isSidebarOpen && "Cerrar Sesión"}
                    </button>
                </div>
            </div>
        </aside>

          {/* Parte principal */}
            <div className={styles.main} style={{ width: headerWidth}}>
            {/* Header */}
            <header className={styles.appHeader} style={headerStyleCalculated}>
                {/* Botón Toggle Sidebar */}
                <div className="d-flex align-items-center">
                    <button 
                        className={styles.sidebarToggleBtn} 
                        onClick={toggleSidebar} 
                        aria-label="Toggle Sidebar"
                        style={{ color: 'var(--color-accent)', borderColor: 'var(--color-muted)' }}
                    >
                        <i className="fa-solid fa-bars"></i>
                    </button>
                    {/* Fecha */}
                    <div className="ms-4 small d-none d-sm-block" style={{ color: 'var(--color-text)' }}>
                        {currentDate}
                    </div>
                </div>

                {/* Bloque de acciones */}
                <div className="header-inner d-flex align-items-center gap-2 ms-auto">
                    {/* Notificaciones */}
                    <div className="action">
                        <button 
                            className={styles.btnIcon} 
                            aria-label="Notificaciones"
                            style={{ color: 'var(--color-accent)' }}
                        >
                            <i className="fa-solid fa-bell"></i>
                            <span className={styles.badgeDot} style={{backgroundColor: 'var(--color-btn-delete)'}}></span>
                        </button>
                    </div>
                <div className="vr mx-auto" style={{borderColor: 'var(--color-muted)'}}></div>

                {/* Avatar */}
                <div className="action">
                    <img
                        src={usuario}
                        alt="Usuario"
                        className={`rounded-circle ${styles.headerAvatar}`}
                        style={{ border: `1px solid var(--color-accent)` }}
                    />
                </div>
            </div>
          </header>
                
          {/* Contenido principal de las rutas */}
            <main className={styles.appContent}>
                <div className="p-4 flex-grow-1">
                    <Routes>
                        <Route path="Insumos" element={<Insumos />} />
                        <Route path="Pedidos_Cocinero" element={<Pedidos_Cocinero />} />
                        <Route path="*" element={<Pedidos_Cocinero />} />
                    </Routes>
                </div>
            </main>
        </div>
    </div>
  );
}
export default Cocinero;
