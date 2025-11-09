import { Table, Button, Modal, Form, Container, Row, Col } from "react-bootstrap";
import { useState, useEffect } from "react";

import styles from './Usuario.module.css';

// Estilos 
  const headerStyle = { 
    backgroundColor: 'var(--color-header)', 
    color: 'var(--color-title)', 
    borderColor: 'var(--color-muted)' 
  };

  const cardStyle = { 
    backgroundColor: 'var(--color-card)', 
    color: 'var(--color-text)', 
    borderColor: 'var(--color-muted)' 
  };

  const inputStyle = { 
    backgroundColor: 'var(--color-bg)', 
    color: 'var(--color-text)', 
    borderColor: 'var(--color-accent)' 
  };

  const tableHeaderStyle = { 
    backgroundColor: 'var(--color-header)', 
    color: 'var(--color-title)', 
    borderBottom: `2px solid var(--color-accent)`
  };  

  const tableRowStyle = { 
    backgroundColor: 'var(--color-card)', 
    color: 'var(--color-text)' 
  };

  const btnAdd = { 
    backgroundColor: 'var(--color-accent)', 
    borderColor: 'var(--color-accent)', 
    color: 'white' 
  };

  const btnEdit = { 
    backgroundColor: 'var(--color-btn)', 
    borderColor: 'var(--color-btn)', 
    color: 'white' 
  };

  const btnDelete = { 
    backgroundColor: 'var(--color-btn-delete)', 
    borderColor: 'var(--color-btn-delete)', 
    color: 'var(--color-text)' 
  };

  const btnSecondary = { 
    backgroundColor: 'var(--color-muted)', 
    borderColor: 'var(--color-muted)', 
    color: 'white' 
  };

    // Helper para inputs
  const InputComponent = ({ label, value, onChange, type = "text", maxLength, required = true, disabled = false }) => (
      <Form.Group as={Col} md="6" className="mb-3">
          <Form.Label style={{ color: 'var(--color-text)' }}>{label}</Form.Label>
          <Form.Control
              type={type}
              value={value}
              onChange={onChange}
              maxLength={maxLength}
              style={inputStyle}
              required={required}
              disabled={disabled}
          />
      </Form.Group>
  );
function Usuario() {
  const [showModalA, setShowModalA] = useState(false);
  const [showModalE, setShowModalE] = useState(false);
  const [showModalB, setShowModalB] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState(() => () => {});
  const [isSuccess, setIsSuccess] = useState(true);

  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [rolUsuario, setRolUsuario] = useState("");
  const [apellidosUsuario, setApellidosUsuario] = useState("");
  const [username, setUsername] = useState("");
  const [correoUsuario, setCorreoUsuario] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [contrasena, setContrasena] = useState("");
  const [telefono, setTelefono] = useState("");
  const [pin, setPIN] = useState("");
  const [nombreUsuarioE, setNombreUsuarioE] = useState("");
  const [rolUsuarioE, setRolUsuarioE] = useState("");
  const [apellidosUsuarioE, setApellidosUsuarioE] = useState("");
  const [usernameE, setUsernameE] = useState("");
  const [correoUsuarioE, setCorreoUsuarioE] = useState("");
  const [contrasenaE, setContrasenaE] = useState("");
  const [telefonoE, setTelefonoE] = useState("");
  const [pinE, setPINE] = useState("");

  const rolMap = { Mozo: 1, Cocina: 2, Caja: 3, Admin: 4 };

  // Modal de confirmación
  const showMessageModal = (message, success = true, action = () => setShowConfirmModal(false)) => {
      setConfirmMessage(message);
      setIsSuccess(success);
      setConfirmAction(() => action);
      setShowConfirmModal(true);
  };

  const handleEditarUsuario = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setNombreUsuarioE(usuario.nombre);
    setApellidosUsuarioE(usuario.apellido);
    setRolUsuarioE(rolMap[usuario.rol] || 0);
    setUsernameE(usuario.username || "");
    setContrasenaE(usuario.contrasena || "");
    setPINE(usuario.pin || "");
    setCorreoUsuarioE(usuario.correo_electronico || "");
    setTelefonoE(usuario.telefono || "");
    setContrasenaE(""); 
    setPINE(""); 
    setShowModalE(true);
  };

  useEffect(() => {
    fetch("http://127.0.0.1:8000/empleados/")
      .then((res) => res.json())
      .then((data) => setUsuarios(data))
      .catch((err) => console.log(err));
  }, []);

  async function AgregarUsuario() {
    const nuevoUsuario = {
      nombres: nombreUsuario,
      apellidos: apellidosUsuario,
      rol: Number(rolUsuario),
      telefono: telefono,
      correo: correoUsuario,
      nombreUs: (rolUsuario === 4 || rolUsuario === 3) ? username : null,
      contrasenaUs: (rolUsuario === 4 || rolUsuario === 3) ? contrasena : null,
      PIN: rolUsuario === 1 ? pin : null,
    };

    if (!nombreUsuario || !apellidosUsuario || !rolUsuario || !telefono || !correoUsuario) {
        showMessageModal("Por favor, rellene todos los campos obligatorios", false);
        return;
    }

    try {
      const respuesta = await fetch("http://127.0.0.1:8000/empleados/agregar", {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify(nuevoUsuario),
      });

      if (respuesta.ok) {         
        await fetch("http://127.0.0.1:8000/empleados/")
        .then((res) => res.json())
        .then((data) => setUsuarios(data));
        showMessageModal("El empleado fue creado correctamente", true);
        setShowModalA(false);
        // Limpiar estados
        setNombreUsuario("");
        setApellidosUsuario("");
        setRolUsuario("");
        setTelefono("");
        setCorreoUsuario("");
        setUsername("");
        setContrasena("");
        setPIN("");
      } else {
        throw new Error("Error al agregar usuario");
      }
    } catch (error) {
      console.error("Error en la conexión", error);
      showMessageModal("Error de conexión o datos inválidos", false);
    }
  }

  async function EditarUsuario() {
    if (!usuarioSeleccionado) return;

    const datosActualizados = {
      nombres: nombreUsuarioE,
      apellidos: apellidosUsuarioE,
      rol: Number(rolUsuarioE),
      telefono: telefonoE,
      correo: correoUsuarioE,
      nombreUs: (rolUsuarioE === 4 || rolUsuarioE === 3) ? usernameE : null,
      contrasenaUs: (rolUsuarioE === 4 || rolUsuarioE === 3) ? (contrasenaE || null) : null,
      PIN: rolUsuarioE === 1 ? (pinE || null) : null,
    };

    try {
      const respuesta = await fetch(
        `http://127.0.0.1:8000/empleados/editar/${usuarioSeleccionado.id}`,
        {
          method: "PUT",
          headers: { "Content-type": "application/json" },
          body: JSON.stringify(datosActualizados),
        }
      );

      if (!respuesta.ok) throw new Error("No se pudo editar el usuario");
      await fetch("http://127.0.0.1:8000/empleados/")
      .then((res) => res.json())
      .then((data) => setUsuarios(data));
      showMessageModal("Empleado editado correctamente", true);
      setShowModalE(false);
    } catch (error) {
      console.error("Hubo un error en la conexión:", error);
      showMessageModal("Error de conexión o datos inválidos al editar empleado", false);
    }
  }

  async function EliminarUsuario(id) {
    try {
      const eliminacion = await fetch(
        `http://127.0.0.1:8000/empleados/eliminar/${usuarioSeleccionado.id}`,
        {
          method: "DELETE",
        }
      );

      if (!eliminacion.ok) throw new Error("Error al eliminar el usuario");

      const mensajeEliminacion = await eliminacion.json();
      setUsuarios(usuarios.filter((usuario) => usuario.id !== id));
      setShowModalB(false);
      showMessageModal("" + mensajeEliminacion.mensaje, true);
    } catch (error) {
      console.error("Hubo un error en la conexión", error);
      showMessageModal("Error de conexión al intentar eliminar", false);
    }
  }

  const usuariosVisibles = usuarios;

  return (
    <Container className="py-2" style={{backgroundColor: 'var(--color-bg)', color: 'var(--color-text)'}}>
        {/* Encabezado y Botón de Agregar */}
        <div className={`mb-4 d-flex justify-content-between align-items-center`}>
          <h1 className="fs-1 m-0 fw-bold" style={{ color: 'var(--color-title)', fontFamily: 'var(--font-basic)' }}>
            Gestión de Empleados
          </h1>
          <button style={{...btnAdd, padding: '8px'}} onClick={() => setShowModalA(true)}>
            <i className="fa-solid fa-user-plus me-2"></i> Agregar Empleado
          </button>
        </div>

        {/* Descripción de Módulo */}
        <p className="mb-4" style={{color: 'var(--color-muted)'}}>
            Administra los datos, roles y credenciales de acceso de todo el personal (Mozos, Cocina, Caja y Administradores)
        </p>

        {/* Tabla de Usuarios */}
        <Table responsive hover className={styles.themedTable}>
          <thead style={tableHeaderStyle}>
            <tr>
              <th className={styles.tableHead}>Nombres</th>
              <th className={styles.tableHead}>Apellidos</th>
              <th className={styles.tableHead}>Username</th>
              <th className={styles.tableHead}>Rol</th>
              <th className={styles.tableHead}>Teléfono</th>
              <th className={styles.tableHead}>Correo electrónico</th>
              <th className={styles.tableHead}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosVisibles.map((usuario) => (
              <tr key={usuario.id} style={tableRowStyle}>
                  <td>{usuario.nombre}</td>
                  <td>{usuario.apellido}</td>
                  <td>{usuario.nombreUs || '-'}</td>
                  <td>
                    <span 
                        className={`badge`} 
                        style={{
                            color: 'white', 
                            backgroundColor: 
                                usuario.rol === 'Admin' ? 'var(--color-accent)' : 
                                usuario.rol === 'Mozo' ? 'var(--color-secondary)' : 
                                usuario.rol === 'Caja' ? 'var(--color-btn)' :
                                'var(--color-title)'
                        }}
                    >
                        {usuario.rol}
                    </span>
                  </td>
                  <td>{usuario.telefono}</td>
                  <td>{usuario.correo_electronico}</td>
                  <td>
                      <Button size="sm" className="mx-1" style={btnEdit} onClick={() => handleEditarUsuario(usuario)}>
                        <i className="fa-solid fa-edit"></i>
                      </Button>
                      <Button size="sm" style={btnDelete} onClick={() => { setShowModalB(true); setUsuarioSeleccionado(usuario); }}>
                          <i className="fa-solid fa-trash"></i>
                      </Button>
                  </td>
                </tr>
            ))}
              {usuariosVisibles.length === 0 && (
                  <tr><td colSpan="7" className="text-center" style={{color: 'var(--color-muted)'}}>No hay empleados registrados</td></tr>
              )}
          </tbody>
        </Table>

        {/* Modal para agregar usuario */}
        {showModalA && (
                <>
                    <div className={`${styles.modalOverlay} d-flex align-items-center justify-content-center`}>
                        <div className={styles.modalContentWide} style={cardStyle}> 
                            <div className={styles.modalHeader} style={headerStyle}>
                                <h5 style={{color: 'var(--color-title)'}}> Agregar Nuevo Empleado</h5>
                                <button 
                                  type="button" 
                                  className="btn-close" 
                                  onClick={() => setShowModalA(false)}
                                  style={{ filter: 'var(--logo-filter)' }}
                                  ></button>
                            </div>
                            <div className={styles.modalBody}>
                                <Form>
                                    <Row>
                                        <InputComponent label="Nombres:" value={nombreUsuario} onChange={(e) => setNombreUsuario(e.target.value)} />
                                        <InputComponent label="Apellidos:" value={apellidosUsuario} onChange={(e) => setApellidosUsuario(e.target.value)} />
                                    </Row>
                                    <Row>
                                        <InputComponent label="Teléfono:" value={telefono} onChange={(e) => setTelefono(e.target.value)} maxLength="9" />
                                        <InputComponent label="Correo Electrónico:" value={correoUsuario} onChange={(e) => setCorreoUsuario(e.target.value)} type="email" />
                                    </Row>
                                    
                                    <Form.Group className="mb-3">
                                        <Form.Label style={{ color: 'var(--color-text)' }}>Selecciona el tipo de empleado:</Form.Label>
                                        <Form.Select className="w-100" style={inputStyle} value={rolUsuario} onChange={(e) => setRolUsuario(Number(e.target.value))} required>
                                            <option value="">---Selecciona---</option>
                                            <option value="1">Mozo</option>
                                            <option value="2">Cocina</option>
                                            <option value="3">Caja</option>
                                            <option value="4">Admin</option>
                                        </Form.Select>
                                    </Form.Group>

                                    {(rolUsuario === 4 || rolUsuario === 3) && (
                                        <Row>
                                            <InputComponent label="Nombre de Cuenta:" value={username} onChange={(e) => setUsername(e.target.value)} required={false} />
                                            <InputComponent label="Contraseña:" value={contrasena} onChange={(e) => setContrasena(e.target.value)} type="password" required={false} />
                                        </Row>
                                    )}
                                    {rolUsuario === 1 && (
                                        <InputComponent label="Número de PIN (4 dígitos):" value={pin} onChange={(e) => setPIN(e.target.value)} maxLength="4" required={false} />
                                    )}
                                </Form>
                            </div>
                            <div className={styles.modalFooter} style={headerStyle}>
                                <Button style={btnSecondary} onClick={() => setShowModalA(false)}>Cancelar</Button>
                                <Button style={btnAdd} onClick={AgregarUsuario}>Guardar Empleado</Button>
                            </div>
                        </div>
                    </div>
                    <div className={styles.modalBackdrop} onClick={() => setShowModalA(false)}></div>
                </>
            )}

        {/*Modal para editar */}
        {showModalE && (
            <>
                <div className={`${styles.modalOverlay} d-flex align-items-center justify-content-center`}>
                    <div className={styles.modalContentWide} style={cardStyle}>
                        <div className={styles.modalHeader} style={headerStyle}>
                            <h5 style={{color: 'var(--color-title)'}}>Editar Empleado: {usuarioSeleccionado?.nombre}</h5>
                            <button type="button" className="btn-close" onClick={() => setShowModalE(false)} style={{ filter: 'var(--logo-filter)' }}></button>
                        </div>
                        <div className={styles.modalBody}>
                            <Form>
                                <Row>
                                    <InputComponent label="Nombres:" value={nombreUsuarioE} onChange={(e) => setNombreUsuarioE(e.target.value)} />
                                    <InputComponent label="Apellidos:" value={apellidosUsuarioE} onChange={(e) => setApellidosUsuarioE(e.target.value)} />
                                </Row>
                                <Row>
                                    <InputComponent label="Teléfono:" value={telefonoE} onChange={(e) => setTelefonoE(e.target.value)} maxLength="9" />
                                    <InputComponent label="Correo Electrónico:" value={correoUsuarioE} onChange={(e) => setCorreoUsuarioE(e.target.value)} type="email" />
                                </Row>
                                
                                <Form.Group className="mb-3">
                                    <Form.Label style={{ color: 'var(--color-text)' }}>Tipo de empleado:</Form.Label>
                                    <Form.Select className="w-100" style={inputStyle} value={rolUsuarioE} onChange={(e) => setRolUsuarioE(Number(e.target.value))} required>
                                        <option value="1">Mozo</option>
                                        <option value="2">Cocina</option>
                                        <option value="3">Caja</option>
                                        <option value="4">Admin</option>
                                    </Form.Select>
                                </Form.Group>

                                {(rolUsuarioE === 4 || rolUsuarioE === 3) && (
                                    <Row>
                                        <InputComponent label="Username:" value={usernameE} onChange={(e) => setUsernameE(e.target.value)} required={false} />
                                        <InputComponent label="Nueva Contraseña:" value={contrasenaE} onChange={(e) => setContrasenaE(e.target.value)} type="password" required={false} />
                                    </Row>
                                )}
                                {rolUsuarioE === 1 && (
                                    <InputComponent label="Nuevo PIN:" value={pinE} onChange={(e) => setPINE(e.target.value)} maxLength="4" required={false} />
                                )}
                            </Form>
                        </div>
                        <div className={styles.modalFooter} style={headerStyle}>
                            <Button style={btnSecondary} onClick={() => setShowModalE(false)}>Cancelar</Button>
                            <Button style={btnEdit} onClick={EditarUsuario}>Guardar Cambios</Button>
                        </div>
                    </div>
                </div>
                <div className={styles.modalBackdrop} onClick={() => setShowModalE(false)}></div>
            </>
        )}

        {/*Modal para eliminar */}
        <Modal show={showModalB} onHide={() => setShowModalB(false)} centered>
            <Modal.Header style={headerStyle} closeButton>
                <Modal.Title style={{color: 'var(--color-title)'}}>Confirmación de Eliminación</Modal.Title>
            </Modal.Header>
            <Modal.Body style={cardStyle}>
                <p style={{color: 'var(--color-text)'}}>
                    ¿Estás seguro de que deseas eliminar a <b>{usuarioSeleccionado?.nombre} {usuarioSeleccionado?.apellido}</b>?
                </p>
            </Modal.Body>
            <Modal.Footer style={headerStyle}>
                <Button style={btnSecondary} onClick={() => setShowModalB(false)}>No</Button>
                <Button style={btnDelete} onClick={() => EliminarUsuario(usuarioSeleccionado?.id)}>
                    Sí, Eliminar
                </Button>
            </Modal.Footer>
        </Modal>

        {/*Modal de Alerta */}
        <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
            <Modal.Header style={headerStyle} closeButton>
                <Modal.Title style={{color: 'var(--color-title)'}}>Notificación</Modal.Title>
            </Modal.Header>
            <Modal.Body style={cardStyle}>
                <div className="text-center py-4">
                    <i 
                        className={`fa-solid mb-3 ${isSuccess ? 'fa-circle-check' : 'fa-circle-xmark'}`} 
                        style={{ 
                            fontSize: '3rem', 
                            color: isSuccess ? 'var(--color-accent)' : 'var(--color-btn-delete)' 
                        }}
                    ></i>
                    <p className="fw-bold" style={{color: 'var(--color-text)'}}>{confirmMessage}</p>
                </div>
            </Modal.Body>
            <Modal.Footer style={headerStyle}>
                <Button style={btnAdd} onClick={confirmAction}>Aceptar</Button>
            </Modal.Footer>
        </Modal>
      </Container>
  );
}
export default Usuario;
