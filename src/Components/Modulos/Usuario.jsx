import { Table } from "react-bootstrap";
import { useState, useEffect } from "react";
function Usuario() {
  const [showModalA, setShowModalA] = useState(false);
  const [showModalE, setShowModalE] = useState(false);
  const [showModalB, setShowModalB] = useState(false);
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
  const rolMap = {
    Mozo: 1,
    Cocina: 2,
    Caja: 3,
    Admin: 4,
  };
  const handleEditarUsuario = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setNombreUsuarioE(usuario.nombre);
    setApellidosUsuarioE(usuario.apellido);
    setRolUsuarioE(rolMap[usuario.rol]);
    setUsernameE(usuario.username || "");
    setContrasenaE(usuario.contrasena || "");
    setPINE(usuario.pin || "");
    setCorreoUsuarioE(usuario.correo_electronico || "");
    setTelefonoE(usuario.telefono || "");
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
      nombreUs: username || null,
      contrasenaUs: contrasena || null,
      PIN: pin || null,
    };
    try {
      const respuesta = await fetch("http://127.0.0.1:8000/empleados/agregar", {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify(nuevoUsuario),
      });
      if (!respuesta.ok) throw new Error("Error al agregar usuario");
      const usuarioCreado = await respuesta.json();
      setUsuarios([...usuarios, usuarioCreado]);
      alert("El usuario fue creado correctamente");
      setShowModalA(false);
    } catch (error) {
      console.error("Error en la conexión", error);
    }
  }
  async function EditarUsuario() {
    if (!usuarioSeleccionado) return;
    const datosActualizados = {
      nombres: nombreUsuarioE,
      apellidos: apellidosUsuarioE,
      rol: parseInt(rolUsuarioE),
      telefono: telefonoE,
      correo: correoUsuarioE,
      nombreUs: usernameE,
      contrasenaUs: contrasenaE,
      PIN: pinE,
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
      if (!respuesta.ok) return alert("No se pudo editar el usuario.");
      const usuarioEditado = await respuesta.json();
      setUsuarios((prevUsuarios) =>
        prevUsuarios.map((u) =>
          u.id === usuarioEditado.id ? usuarioEditado : u
        )
      );
      alert("Usuario editado correctamente");
      setShowModalE(false);
    } catch (error) {
      console.error("Hubo un error en la conexión:", error);
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
      if (!eliminacion.ok) return alert("Error al eliminar el usuario");
      const mensajeEliminacion = await eliminacion.json();
      alert(mensajeEliminacion.mensaje);
      setUsuarios(usuarios.filter((usuario) => usuario.id !== id));
      setShowModalB(false);
    } catch (error) {
      console.error("Hubo un error en la conexión", error);
    }
  }
  const usuariosVisibles = usuarios;
  return (
    <>
      <div>
        <h1 className="fs-1">Área de manejo de usuarios</h1>
        <div className="Opciones">
          <button
            type="button"
            className="btn btn-primary my-3 mx-2"
            onClick={() => {
              setShowModalA(true);
            }}
          >
            Agregar usuario
          </button>
        </div>
        <Table responsive hover className="mb-0">
          <thead className="bg-light">
            <tr>
              <th>ID</th>
              <th>Nombres</th>
              <th>Apellidos</th>
              <th>Username</th>
              <th>Rol</th>
              <th>Teléfono</th>
              <th>Correo electrónico</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosVisibles.map((usuario) => {
              return (
                <tr key={usuario.id}>
                  <td>{usuario.id}</td>
                  <td>{usuario.nombre}</td>
                  <td>{usuario.apellido}</td>
                  <td>{usuario.nombreUs}</td>
                  <td>{usuario.rol}</td>
                  <td>{usuario.telefono}</td>
                  <td>{usuario.correo_electronico}</td>
                  <td>
                    <div>
                      <button
                        type="button"
                        className="btn btn-warning my-3 mx-2"
                        onClick={() => {
                          handleEditarUsuario(usuario);
                          setShowModalE(true);
                        }}
                      >
                        Editar usuario
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger my-3 mx-2"
                        data-bs-toggle="modal"
                        data-bs-target="#exampleModal3"
                        data-bs-whatever="@mdo"
                        onClick={() => {
                          setShowModalB(true);
                          setUsuarioSeleccionado(usuario);
                        }}
                      >
                        Eliminar usuario
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
        {/*Modal para agregar usuario */}
        {showModalA && (
          <>
            <div
              className="modal fade show d-block"
              tabIndex="-1"
              aria-hidden="false"
            >
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h1 className="modal-title fs-4" id="exampleModalLabel">
                      Ingrese los datos del usuario
                    </h1>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setShowModalA(false)}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <form>
                      <div className="mb-3">
                        <label
                          htmlFor="recipient-name"
                          className="form-label fs-5"
                        >
                          Nombres del usuario:
                        </label>
                        <input
                          type="text"
                          className="form-control mx-auto"
                          value={nombreUsuario}
                          onChange={(e) => setNombreUsuario(e.target.value)}
                        />
                        <label
                          htmlFor="recipient-name"
                          className="form-label fs-5"
                        >
                          Apellidos del usuario:
                        </label>
                        <input
                          type="text"
                          className="form-control mx-auto"
                          value={apellidosUsuario}
                          onChange={(e) => setApellidosUsuario(e.target.value)}
                        />
                        <label>Seleciona el tipo de empleado:</label>
                        <select
                          className="form-control mx-auto"
                          value={rolUsuario}
                          onChange={(e) =>
                            setRolUsuario(Number(e.target.value))
                          }
                        >
                          <option value="">---Selecciona---</option>
                          <option value="1">Mozo</option>
                          <option value="2">Cocina</option>
                          <option value="3">Caja</option>
                          <option value="4">Admin</option>
                        </select>
                        {(rolUsuario === 4 || rolUsuario === 3) && (
                          <>
                            <label
                              htmlFor="recipient-name"
                              className="form-label fs-5"
                            >
                              Nombre de cuenta:
                            </label>
                            <input
                              type="text"
                              className="form-control mx-auto"
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                            />
                            <label
                              htmlFor="recipient-name"
                              className="form-label fs-5"
                            >
                              Contraseña de la cuenta
                            </label>
                            <input
                              type="text"
                              className="form-control mx-auto"
                              value={contrasena}
                              onChange={(e) => setContrasena(e.target.value)}
                            />{" "}
                          </>
                        )}
                        {rolUsuario === 1 && (
                          <>
                            <label>Número de PIN:</label>
                            <input
                              type="text"
                              maxLength="4"
                              className="form-control mx-auto"
                              value={pin}
                              onChange={(e) => setPIN(e.target.value)}
                            />
                          </>
                        )}
                        <label>Ingresa tu correo:</label>
                        <input
                          type="email"
                          className="form-control mx-auto"
                          value={correoUsuario}
                          onChange={(e) => setCorreoUsuario(e.target.value)}
                        />
                        <label>Ingresa el telefono del usuario:</label>
                        <input
                          type="text"
                          maxLength="9"
                          className="form-control mx-auto"
                          value={telefono}
                          onChange={(e) => setTelefono(e.target.value)}
                        />
                      </div>
                    </form>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={AgregarUsuario}
                    >
                      Agregar usuario
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div
              className="modal-backdrop fade show"
              onClick={() => setShowModalA(false)}
            ></div>
          </>
        )}
        {/*Modal para editar */}
        {showModalE && (
          <>
            <div
              className="modal fade show d-block"
              tabIndex="-1"
              aria-hidden="false"
            >
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h1 className="modal-title fs-4" id="exampleModalLabel">
                      Ingrese los datos del usuario
                    </h1>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setShowModalE(false)}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <form>
                      <div className="mb-3">
                        <label
                          htmlFor="recipient-name"
                          className="form-label fs-5"
                        >
                          Nombres del usuario:
                        </label>
                        <input
                          type="text"
                          className="form-control mx-auto"
                          value={nombreUsuarioE}
                          onChange={(e) => setNombreUsuarioE(e.target.value)}
                        />
                        <label
                          htmlFor="recipient-name"
                          className="form-label fs-5"
                        >
                          Apellidos del usuario:
                        </label>
                        <input
                          type="text"
                          className="form-control mx-auto"
                          value={apellidosUsuarioE}
                          onChange={(e) => setApellidosUsuarioE(e.target.value)}
                        />
                        <label>Seleciona el tipo de empleado:</label>
                        <select
                          className="form-control mx-auto"
                          value={rolUsuarioE}
                          onChange={(e) =>
                            setRolUsuarioE(Number(e.target.value))
                          }
                        >
                          <option value="">---Selecciona---</option>
                          <option value="1">Mozo</option>
                          <option value="2">Cocina</option>
                          <option value="3">Caja</option>
                          <option value="4">Admin</option>
                        </select>
                        {(rolUsuarioE === 4 || rolUsuarioE === 3) && (
                          <>
                            <label
                              htmlFor="recipient-name"
                              className="form-label fs-5"
                            >
                              Nombre de cuenta:
                            </label>
                            <input
                              type="text"
                              className="form-control mx-auto"
                              value={usernameE}
                              onChange={(e) => setUsernameE(e.target.value)}
                            />
                            <label
                              htmlFor="recipient-name"
                              className="form-label fs-5"
                            >
                              Contraseña de la cuenta
                            </label>
                            <input
                              type="text"
                              className="form-control mx-auto"
                              value={contrasenaE}
                              onChange={(e) => setContrasenaE(e.target.value)}
                            />{" "}
                          </>
                        )}
                        {rolUsuarioE === 1 && (
                          <>
                            <label>Número de PIN:</label>
                            <input
                              type="text"
                              maxLength="4"
                              className="form-control mx-auto"
                              value={pinE}
                              onChange={(e) => setPINE(e.target.value)}
                            />
                          </>
                        )}
                        <label>Ingresa tu correo:</label>
                        <input
                          type="email"
                          className="form-control mx-auto"
                          value={correoUsuarioE}
                          onChange={(e) => setCorreoUsuarioE(e.target.value)}
                        />
                        <label>Ingresa el telefono del usuario:</label>
                        <input
                          type="text"
                          maxLength="9"
                          className="form-control mx-auto"
                          value={telefonoE}
                          onChange={(e) => setTelefonoE(e.target.value)}
                        />
                      </div>
                    </form>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-warning"
                      onClick={EditarUsuario}
                    >
                      EditarUsuario
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div
              className="modal-backdrop fade show"
              onClick={() => setShowModalE(false)}
            ></div>
          </>
        )}
        {/*Modal para eliminar */}
        {showModalB && (
          <>
            <div
              className="modal fade show d-block"
              tabIndex="-1"
              aria-hidden="false"
            >
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-title">Confirmación de eliminación</div>
                  <div className="modal-body">
                    <label>
                      ¿Estás seguro de que deseas eliminar este Usuario?
                    </label>
                    <button
                      type="submit"
                      className="btn btn-danger mx-1"
                      onClick={() => EliminarUsuario(usuarioSeleccionado?.id)}
                    >
                      Sí
                    </button>
                    <button
                      className="btn btn-success mx-1"
                      onClick={() => setShowModalB(false)}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div
              className="modal-backdrop fade show"
              onClick={() => setShowModalB(false)}
            ></div>
          </>
        )}
      </div>
    </>
  );
}
export default Usuario;
