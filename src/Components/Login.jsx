import { useState } from "react";
import comida from "../assets/comida.png";
import { useNavigate, Link } from "react-router-dom";
import "./App.css";
function App() {
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [contrasena, setNombreContrasena] = useState("");
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const navigate = useNavigate();
  const handleSubmit = (e) => {
    e.preventDefault();
    if (nombreUsuario === "admin" && contrasena === "admin123") {
      localStorage.setItem("userRole", "admin");
      localStorage.setItem("isAuthenticated", "true");
      navigate("/admin");
    } else if (nombreUsuario === "caja" && contrasena === "caja123") {
      localStorage.setItem("userRole", "caja");
      localStorage.setItem("isAuthenticated", "true");
      navigate("/caja");
    } else {
      alert("Credenciales inválidas");
    }
  };
  const toggleMostrarContrasena = () => {
    setMostrarContrasena(!mostrarContrasena);
  };
  return (
    <>
      <div className="container">
        <div className="d-flex justify-content-center">
          <img
            src={comida}
            alt="Icono de comida"
            className="img-fluid rounded-circle"
          />
        </div>
        <h1 className="text-center mb-4 display-3">
          Software para gestionar pedidos
        </h1>
        <form
          onSubmit={handleSubmit}
          className="card p-4 shadow mx-auto align-items-center"
        >
          <h2 className="mb-3 display-4 text-center">Iniciar Sesión</h2>
          <label htmlFor="nombreUsuario" className="form-label fs-4">
            Usuario:
          </label>
          <input
            type="text"
            id="nombreUsuario"
            name="nombreUsuario"
            value={nombreUsuario}
            onChange={(e) => setNombreUsuario(e.target.value)}
            className="form-control fs-5"
          />
          <label htmlFor="contrasena" className="form-label fs-4">
            Contraseña:
          </label>
          <div className="contenedorContra">
            <input
              className="form-control fs-5 contrasena"
              type={mostrarContrasena ? "text" : "password"}
              id="contrasena"
              name="contrasena"
              value={contrasena}
              onChange={(e) => setNombreContrasena(e.target.value)}
            />
            <i
              className={`fa-solid ${
                mostrarContrasena ? "fa-eye" : "fa-eye-slash"
              }`}
              onClick={toggleMostrarContrasena}
            ></i>
          </div>
          <div class="d-flex gap-4 align-items-center">
            <Link to="/mesero" className="px-4 fs-5  text-dark">
              Soy mesero
            </Link>
            <button type="submit" className="btn btn-success fs-4  mt-3 ">
              Ingresar
            </button>
            <Link to="/cocina" className="px-4 fs-5 text-dark">
              Soy del área de cocina
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}
export default App;
