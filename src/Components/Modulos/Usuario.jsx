import { Table } from "react-bootstrap";
import { useState, useEffect } from "react";
function Usuario() {
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [rolUsuario, setRolUsuario] = useState("");
  const [apellidosUsuario, setApellidosUsuario] = useState("");
  const [username, setUsername] = useState("");
  const [correoUsuario, setCorreoUsuario] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [contrasena, setContrasena] = useState("");
  const [telefono, setTelefono] = useState("");
  const [pin, setPIN] = useState("");

  function agregarUsuario() {}
  useEffect(() => {
    fetch("http://127.0.0.1:8000/empleados/")
      .then((res) => res.json())
      .then((data) => setUsuarios(data))
      .catch((err) => console.log(err));
  });
  const usuariosVisibles = usuarios;
  return (
    <>
      <div>
        <h1 className="fs-1">Área de manejo de usuarios</h1>
        <div className="Opciones">
          <button
            type="button"
            className="btn btn-primary my-3 mx-2"
            data-bs-toggle="modal"
            data-bs-target="#exampleModal1"
            data-bs-whatever="@mdo"
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
                <tr>
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
                        data-bs-toggle="modal"
                        data-bs-target="#exampleModal2"
                        data-bs-whatever="@mdo"
                      >
                        Editar usuario
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger my-3 mx-2"
                        data-bs-toggle="modal"
                        data-bs-target="#exampleModal3"
                        data-bs-whatever="@mdo"
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
        <div
          className="modal fade"
          id="exampleModal1"
          tabIndex="-1"
          aria-labelledby="exampleModalLabel"
          aria-hidden="true"
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
                  data-bs-dismiss="modal"
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <form>
                  <div className="mb-3">
                    <label htmlFor="recipient-name" className="form-label fs-5">
                      Nombres del usuario:
                    </label>
                    <input
                      type="text"
                      className="form-control mx-auto"
                      value={nombreUsuario}
                      onChange={(e) => setNombreUsuario(e.target.value)}
                    />
                    <label htmlFor="recipient-name" className="form-label fs-5">
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
                      onChange={(e) => setRolUsuario(Number(e.target.value))}
                    >
                      <option value="">---Selecciona---</option>
                      <option value="1">Mozo</option>
                      <option value="2">Cocina</option>
                      <option value="3">Caja</option>
                      <option value="4">Admin</option>
                    </select>
                    {(rolUsuario === "1" || rolUsuario === "3") && (
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
                    {rolUsuario === "4" && (
                      <>
                        <label>Número de PIN:</label>
                        <input
                          type="text"
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
                  onClick={agregarUsuario}
                >
                  Agregar usuario
                </button>
              </div>
            </div>
          </div>
        </div>
        {/*Modal para editar */}
        <div
          className="modal fade"
          id="exampleModal2"
          tabIndex="-1"
          aria-labelledby="exampleModalLabel"
          aria-hidden="true"
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
                  data-bs-dismiss="modal"
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <form>
                  <div className="mb-3">
                    <label htmlFor="recipient-name" className="form-label fs-5">
                      Nombres del usuario:
                    </label>
                    <input
                      type="text"
                      className="form-control mx-auto"
                      value={nombreUsuario}
                      onChange={(e) => setNombreUsuario(e.target.value)}
                    />
                    <label htmlFor="recipient-name" className="form-label fs-5">
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
                      onChange={(e) => setRolUsuario(Number(e.target.value))}
                    >
                      <option value="">---Selecciona---</option>
                      <option value="1">Mozo</option>
                      <option value="2">Cocina</option>
                      <option value="3">Caja</option>
                      <option value="4">Admin</option>
                    </select>
                    {(rolUsuario === "1" || rolUsuario === "3") && (
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
                    {rolUsuario === "4" && (
                      <>
                        <label>Número de PIN:</label>
                        <input
                          type="text"
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
                  className="btn btn-warning"
                  onClick={agregarUsuario}
                >
                  EditarUsuario
                </button>
              </div>
            </div>
          </div>
        </div>
        {/*Modal para eliminar */}
        <div
          className="modal fade"
          id="exampleModal3"
          tabIndex="-1"
          aria-labelledby="exampleModalLabel"
          aria-hidden="true"
        >
          <label>¿Estás seguro de que deseas eliminar este Usuario?</label>
          <button type="submit" class="btn btn-danger">
            Sí
          </button>
          <button class="btn btn-success">No</button>
        </div>
      </div>
    </>
  );
}
export default Usuario;
