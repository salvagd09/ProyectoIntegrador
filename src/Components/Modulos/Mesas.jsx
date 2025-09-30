import { useState, useEffect } from "react";
function Mesas() {
  const rol = localStorage.getItem("userRole");
  const [numeroMesa, setNumeroMesa] = useState("");
  const [cantidadMesa, setCantidadMesa] = useState("");
  const [mesas, setMesas] = useState([]);
  useEffect(() => {
    fetch("http://127.0.0.1:8000/mesas/")
      .then((res) => res.json())
      .then((data) => setMesas(data))
      .catch((err) => console.error(err));
  }, []);
  function ocupar(mesaId) {
    {
      fetch(`http://127.0.0.1:8000/mesas/${mesaId}/estado`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      })
        .then((res) => res.json())
        .then((mesaActualizada) => {
          setMesas((prevMesas) =>
            prevMesas.map((m) =>
              m.id === mesaActualizada.id ? mesaActualizada : m
            )
          );
        })
        .catch((err) => console.error(err));
    }
  }
  function agregarMesa() {
    if (!numeroMesa || !cantidadMesa) return;
    const nuevaMesa = { numero: numeroMesa, capacidad: cantidadMesa };
    fetch("http://127.0.0.1:8000/mesas/agregarM", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuevaMesa),
    })
      .then((res) => res.json())
      .then((mesaGuardada) => {
        setMesas([...mesas, mesaGuardada]);
        setNumeroMesa("");
        setCantidadMesa("");
      })
      .catch((err) => console.error(err));
  }
  const mesasVisibles =
    rol == 4 ? mesas : mesas.filter((m) => m.estado === "Ocupada");
  return (
    <>
      <div>
        <h1>
          Área donde se encuentran las mesas {rol == 1 && <h1>ocupadas</h1>}
        </h1>
        <div className="container">
          {rol == 4 && (
            <button
              type="button"
              className="btn btn-primary my-3"
              data-bs-toggle="modal"
              data-bs-target="#exampleModal"
              data-bs-whatever="@mdo"
            >
              Agregar mesas
            </button>
          )}
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
                    Ingrese los datos de la mesa
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
                      <label
                        htmlFor="recipient-name"
                        className="col-form-label"
                      >
                        El nombre de la mesa
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={numeroMesa}
                        onChange={(e) => setNumeroMesa(e.target.value)}
                      />
                      <label htmlFor="mesas">
                        Cantidad de personas para la mesa:
                      </label>
                      <input
                        type="number"
                        value={cantidadMesa}
                        onChange={(e) => setCantidadMesa(e.target.value)}
                      />
                    </div>
                  </form>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={agregarMesa}
                  >
                    Agregar mesa
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div
            className=" d-flex flex-wrap flex-row gap-2  w-100 justify-content-md-between  justify-content-sm-center "
            id="contenedor"
          >
            {mesasVisibles.length === 0 ? (
              <p>No hay mesas validas para este rol</p>
            ) : (
              mesasVisibles.map((mesa) => (
                <div
                  key={mesa.id}
                  className="card  px-1 pb-1 col-lg-3 col-md-4 col-sm-6 "
                >
                  <h5 className="card-title text-white fs-3">
                    Mesa {mesa.numero}
                  </h5>
                  <div className="card-body">
                    <ul className="list-group list-group-flush">
                      <li className="list-group-item my-2">
                        Capacidad: {mesa.capacidad} personas
                      </li>
                      <li className="list-group-item">
                        Estado de la mesa:{" "}
                        <span
                          className={`${
                            mesa.estado === "Libre"
                              ? "text-dark"
                              : "text-danger"
                          } fw-bolder`}
                        >
                          {mesa.estado}
                        </span>
                      </li>
                      {rol == 1 && (
                        <button
                          type="button"
                          className="btn-dark my-2 w-50 mx-auto btn"
                          onClick={() => ocupar(mesa.id)}
                        >
                          Marcar como desocupado
                        </button>
                      )}
                    </ul>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
export default Mesas;
