import { useState, useEffect } from "react";
function Mesas({ rol }) {
  const [numeroMesa, setNumeroMesa] = useState("");
  const [cantidadMesa, setCantidadMesa] = useState("");
  const [mesas, setMesas] = useState([]);
  useEffect(() => {
    fetch("http://localhost:5432/mesas")
      .then((res) => res.json())
      .then((data) => setMesas(data))
      .catch((err) => console.error(err));
  }, []);
  function agregarMesa() {
    if (!numeroMesa || !cantidadMesa) return;
    const nuevaMesa = { numero: numeroMesa, cantidad: cantidadMesa };
    fetch("http://localhost:5432/mesas", {
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
    rol === "admin" ? mesas : mesas.filter((m) => m.ocupada === true);
  return (
    <>
      <div>
        <h1>Área donde se encuentran las mesas</h1>
        <div>
          {rol === "admin" && (
            <>
              <button
                type="button"
                class="btn btn-primary"
                data-bs-toggle="modal"
                data-bs-target="#exampleModal"
                data-bs-whatever="@mdo"
              >
                Agregar mesas
              </button>
            </>
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
                        Número de la mesa
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
          <div className="container" id="contenedor">
            {mesasVisibles.length === 0 ? (
              <p>No hay mesas registradas aún.</p>
            ) : (
              mesasVisibles.map((mesa) => (
                <div key={mesa.id} className="card mb-2">
                  <div className="card-body">
                    <h5 className="card-title">Mesa N° {mesa.numero}</h5>
                  </div>
                  <ul className="list-group list-group-flush">
                    <li className="list-group-item">
                      Capacidad: {mesa.cantidad} personas
                    </li>
                    <li>
                      Estado de la mesa
                      {mesa.ocupada ? "Libre" : "Ocupada"}
                    </li>
                  </ul>
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
