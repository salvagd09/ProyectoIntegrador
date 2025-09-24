import { useState } from "react";
import comida from "../assets/comida.png";
import { useNavigate, Link } from "react-router-dom";
import "./App.css";
function App() {
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [contrasena, setNombreContrasena] = useState("");
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [PIN, setPIN] = useState("");
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://127.0.0.1:8000/auth/login-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: nombreUsuario,
          password: contrasena,
        }),
      });

      if (!res.ok) {
        throw new Error("Credenciales inválidas");
      }

      const data = await res.json();
      console.log(data);
      localStorage.setItem("userRole", data.rol_id);
      localStorage.setItem("isAuthenticated", "true");
      if (data.rol_id === 1) navigate("/admin");
      else if (data.rol_id === 3) navigate("/caja");
    } catch (err) {
      alert(err.message);
    }
  };
  const handleSubmitPin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://127.0.0.1:8000/auth/login-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin_code: PIN }),
      });

      if (!res.ok) {
        throw new Error("PIN inválido");
      }

      const data = await res.json();
      localStorage.setItem("userRole", data.rol);
      localStorage.setItem("isAuthenticated", "true");
      navigate("/mesero");
    } catch (err) {
      alert(err.message);
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
          <div className="d-flex gap-4 align-items-center">
            <button
              type="button"
              className="btn btn-outline-dark fs-4 mt-3"
              data-bs-toggle="modal"
              data-bs-target="#exampleModal"
              data-bs-whatever="@mdo"
            >
              Soy mesero
            </button>
            <button type="submit" className="btn btn-success fs-4  mt-3 ">
              Ingresar
            </button>
            <Link to="/cocina" className="btn btn-outline-dark fs-4 mt-3">
              Soy del área de cocina
            </Link>
          </div>
        </form>
        <div
          className="modal fade"
          id="exampleModal"
          tabIndex="-1"
          aria-labelledby="exampleModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h1 className="modal-title fs-5" id="exampleModalLabel">
                  PIN del mesero
                </h1>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmitPin}>
                  <div className="mb-3 mx-2">
                    <label htmlFor="PIN">Ingresa tu PIN</label>
                    <input
                      type="password"
                      value={PIN}
                      onChange={(e) => setPIN(e.target.value)}
                    />
                  </div>
                  <div className="modal-footer">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      data-bs-dismiss="modal"
                    >
                      Ingresar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
export default App;
