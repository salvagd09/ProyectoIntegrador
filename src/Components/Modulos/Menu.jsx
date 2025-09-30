import { useState } from "react";
function Menu() {
  const [menugeneral, setMenuGeneral] = useState("");
  const rol = localStorage.getItem("userRole");
  function MostrarMenu() {
    return [...setMenuGeneral]; //Solo lo puse para rellenar ahora
  }
  return (
    <>
      <div>
        <h1>Área del menú</h1>
        <div
          className=" d-flex flex-wrap flex-row gap-2  w-100 justify-content-md-between  justify-content-sm-center "
          id="contenedor"
        ></div>
        {menugeneral.map((platillo) => (
          <div
            key={platillo.id}
            className="card  px-1 pb-1 col-lg-3 col-md-4 col-sm-6 "
          >
            <h5 class="card-title">${platillo.nombre}</h5>
            <div class="card-body">
              <ul className="list-group list-group-flush">
                <li className="list-group-item my-2">
                  Categoria:${platillo.categoria}
                </li>
                <li className="list-group-item">
                  Precio:
                  <span className="fw-bolder text-dark">{platillo.precio}</span>
                </li>
                {rol === 1 && <button>Habilitar/Deshabilitar menú</button>}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
export default Menu;
