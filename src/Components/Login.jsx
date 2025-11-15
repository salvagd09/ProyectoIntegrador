import { useState } from "react";
import comida from "../assets/comida.png";
import { useNavigate, Link } from "react-router-dom";
import { Button, Form, Card, Modal } from 'react-bootstrap';

function App() {
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [PIN, setPIN] = useState("");
  const [showMeseroModal, setShowMeseroModal] = useState(false);
  const navigate = useNavigate();

  // Estilos Temáticos
    const cardStyle = {
        backgroundColor: 'var(--color-card)',
        color: 'var(--color-text)',
        borderColor: 'var(--color-muted)',
    };
    const inputStyle = {
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text)',
        borderColor: 'var(--color-muted)',
    };
    const titleStyle = {
        color: 'var(--color-title)',
        fontFamily: 'var(--font-title)',
    };
    const btnPrimaryStyle = {
        backgroundColor: 'var(--color-btn)',
        borderColor: 'var(--color-btn)',
        color: 'white',
        fontWeight: 'bold',
    };
    const btnOutlineStyle = {
        color: 'var(--color-text)',
        borderColor: 'var(--color-accent)',
    };

  const getLogoFilterStyle = () => {
      const rootClass = document.documentElement.className;
      if (rootClass.includes('theme-dark') || rootClass.includes('theme-deep-ocean')) {
          return 'invert(1)';
      }
      return 'none';
  };

  const handleLoginPassword = async (e) => {
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
      // Guardar los datos
      localStorage.setItem("userData", JSON.stringify(data));
      localStorage.setItem("userRole", data.rol_id);
      localStorage.setItem("isAuthenticated", "true");

      if (data.rol_id === 4) navigate("/admin");
      else if (data.rol_id === 3) navigate("/caja");

    } catch (err) {
      alert(err.message);
    }
  };

  const handleLoginPin = async (e) => {
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
      // Guardar los datos
      localStorage.setItem("userData", JSON.stringify(data));
      localStorage.setItem("userRole", data.rol_id);
      localStorage.setItem("isAuthenticated", "true");
      setShowMeseroModal(false);
      // Navegación al apartado mesero
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
      <div className="min-vh-100 d-flex flex-column align-items-center py-5" style={{ backgroundColor: 'var(--color-bg)' }}>
        <div className="container d-flex flex-column align-items-center">
          <div className="d-flex justify-content-center mb-4">
            <img
              src={comida}
              alt="Icono de comida"
              className="img-fluid rounded-circle"
              style={{ width: '150px', height: '150px', filter: getLogoFilterStyle() }}
            />
          </div>
          <h1 className="text-center mb-5 display-5" style={{ color: 'var(--color-title)', fontFamily: 'var(--font-title)' }}>
              Software para gestionar pedidos
          </h1>

          <Card 
              className="p-4 shadow mx-auto w-75 w-md-50" 
              style={cardStyle}
          >
          <Card.Body>
              <h2 className="mb-4 display-6 text-center fw-bold" style={titleStyle}>
                  Iniciar Sesión (Admin/Caja)
              </h2>
              <Form onSubmit={handleLoginPassword}>
                            
                  {/* Usuario */}
                  <Form.Group className="mb-3">
                      <Form.Label htmlFor="nombreUsuario" style={{ color: 'var(--color-text)' }}>Usuario:</Form.Label>
                      <Form.Control
                          type="text"
                          id="nombreUsuario"
                          value={nombreUsuario}
                          onChange={(e) => setNombreUsuario(e.target.value)}
                          style={inputStyle}
                          required
                      />
                  </Form.Group>
                            
                  {/* Contraseña */}
                  <Form.Group className="mb-4">
                      <Form.Label htmlFor="contrasena" style={{ color: 'var(--color-text)' }}>Contraseña:</Form.Label>
                      <div className="input-group">
                          <Form.Control
                              type={mostrarContrasena ? "text" : "password"}
                              id="contrasena"
                              value={contrasena}
                              onChange={(e) => setContrasena(e.target.value)}
                              style={inputStyle}
                              required
                          />
                          {/* Botón de mostrar/ocultar contraseña */}
                          <Button 
                              variant="outline-secondary" 
                              onClick={toggleMostrarContrasena} 
                              style={btnOutlineStyle}
                          >
                              <i className={`fa-solid ${mostrarContrasena ? "fa-eye" : "fa-eye-slash"}`}></i>
                          </Button>
                      </div>
                  </Form.Group>
                            
                  {/* Botón de Ingresar */}
                  <Button type="submit" className="w-100 fs-4 mt-3" style={btnPrimaryStyle}>
                      Ingresar
                  </Button>
            </Form>
        </Card.Body>
    </Card>

    <Card 
        className="p-3 shadow mx-auto mt-4 w-75 w-md-50" 
        style={cardStyle}
    >
        <Card.Body className="d-flex flex-column flex-md-row justify-content-center gap-3">
                        
            <Button
                onClick={() => setShowMeseroModal(true)}
                className="fs-5"
                style={{btnOutlineStyle, backgroundColor: 'var(--color-btn)'}}
            >            
                  <i className="fa-solid fa-bell-concierge me-2"></i> Soy Mesero
            </Button>
                        
            <Link 
                to="/cocina" 
                className="btn fs-5"
                style={{btnOutlineStyle, backgroundColor: 'var(--color-secondary)'}}
            >
                <i className="fa-solid fa-kitchen-set me-2"></i> Soy del área de Cocina
            </Link>
        </Card.Body>
    </Card>
  </div>

            {/* Modal para PIN del Mesero */}
            <Modal show={showMeseroModal} onHide={() => setShowMeseroModal(false)} centered>
                <Modal.Header closeButton style={{ backgroundColor: 'var(--color-header)', borderColor: 'var(--color-muted)', color: 'var(--color-title)' }}>
                    <Modal.Title style={titleStyle}>PIN del Mesero</Modal.Title>
                </Modal.Header>
                <Modal.Body style={cardStyle}>
                    <Form onSubmit={handleLoginPin}>
                        <Form.Group className="mb-3 d-flex align-items-center">
                            <Form.Label htmlFor="PIN" className="mb-0 me-3">Ingresa tu PIN:</Form.Label>
                            <Form.Control
                                type="password"
                                value={PIN}
                                onChange={(e) => setPIN(e.target.value)}
                                style={{ ...inputStyle, width: '150px' }}
                                maxLength={4}
                                required
                            />
                        </Form.Group>
                        <Modal.Footer style={{ borderTop: 'none' }}>
                            <Button 
                                type="submit"
                                style={btnPrimaryStyle}
                            >
                                Ingresar
                            </Button>
                        </Modal.Footer>
                    </Form>
                </Modal.Body>
            </Modal>
      </div>
    </>
  );
}
export default App;
