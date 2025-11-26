import { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Form,
  Modal,
  Badge,
  Alert,
  InputGroup,
} from "react-bootstrap";
import styles from '../Modulos/Menu.module.css';

const API_BASE_URL = "http://127.0.0.1:8000";

function Insumos() {
  const obtenerRol = () => {
    const path = window.location.pathname;
    return path.includes("/cocina/") ? "cocina" : "admin";
  };
  
  const [rol] = useState(obtenerRol());
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [insumoEditando, setInsumoEditando] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todas");
  const [showModalMerma,setShowModalMerma]=useState(false);
  const [registroMerma,setRegistroMerma]=useState([]);
  const [showModalMovimientos,setShowModalMovimientos]=useState(false);
  const [empleadoId,setEmpleadoId]=useState(null);

  // Estilos tematizados 
  const moduleBg = { 
    backgroundColor: 'var(--color-bg)', 
    color: 'var(--color-text)' 
  };
    
  const headerStyle = { 
    backgroundColor: 'var(--color-header)', 
    color: 'var(--color-title)', 
    border: `1px solid var(--color-header)` 
  };
  
  const cardStyle = { 
    backgroundColor: 'var(--color-card)', 
    color: 'var(--color-text)', 
    border: `2px solid var(--color-accent)` 
  };
  
  const inputStyle = { 
    backgroundColor: 'var(--color-bg)', 
    color: 'var(--color-text)', 
    borderColor: 'var(--color-muted)' 
  };
  
  const btnPrimary = { 
    backgroundColor: 'var(--color-btn)', 
    borderColor: 'var(--color-btn)', 
    color: 'white', 
    fontWeight: 'bold' 
  };
  
  const btnSecondary = { 
    backgroundColor: 'var(--color-muted)', 
    borderColor: 'var(--color-muted)', 
    color: 'white'
  };
  
  const btnWarning = { 
    backgroundColor: 'var(--color-accent)', 
    borderColor: 'var(--color-accent)', 
    color: 'white', 
    fontWeight: 'bold' 
  };

  const btnAccent = { 
    backgroundColor: 'var(--color-accent)', 
    borderColor: 'var(--color-accent)', 
    color: 'white', 
    fontWeight: 'bold' 
  };

  const badgeRol = {
    backgroundColor: rol === "admin" ? 'var(--color-btn)' : 'var(--color-secondary)',
    color: 'white'
  };

  // Cargar datos de la base de datos
  const cargarInsumos = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/inventario/`);
      if (!response.ok) throw new Error("Error cargando inventario");
      const data = await response.json();
      setInsumos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarInsumos();
    const userData = localStorage.getItem('userData');
    if (userData) {
      const user = JSON.parse(userData);
      setEmpleadoId(user.id);
    }
  }, []);

  // Crear insumo
  const agregarInsumo = async (nuevoInsumo) => {
    const datosParaBackend = {
      nombre: nuevoInsumo.nombre,
      cantidad: parseFloat(nuevoInsumo.cantidad),
      minimo: parseFloat(nuevoInsumo.minimo),
      categoria: nuevoInsumo.categoria,
      precio: parseFloat(nuevoInsumo.precio),
      unidad: nuevoInsumo.unidad,
      perecible: nuevoInsumo.perecible
    };

    await fetch(`${API_BASE_URL}/api/inventario/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datosParaBackend)
    });

    await cargarInsumos();
    setShowModal(false);
  };

  // Editar insumo
  const editarInsumo = async (insumoActualizado) => {
    const datosParaBackend = {
      nombre: insumoActualizado.nombre,
      cantidad: parseFloat(insumoActualizado.cantidad),
      minimo: parseFloat(insumoActualizado.minimo),
      categoria: insumoActualizado.categoria,
      precio: parseFloat(insumoActualizado.precio),
      unidad: insumoActualizado.unidad,
      perecible: insumoActualizado.perecible
    };
    try {
      await fetch(`${API_BASE_URL}/api/inventario/${insumoActualizado.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosParaBackend)
      });
      // Registrar lote si hay aumento de stock
      if (insumoActualizado.diferencia > 0) {
        await fetch(`${API_BASE_URL}/inventario_L/lote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ingrediente_id: insumoActualizado.id,
            proveedor_id: null,
            cantidad: insumoActualizado.diferencia,
            numero_lote: null,
            fecha_vencimiento: null,
            empleado_id: empleadoId 
          }),
        });
      }
      await cargarInsumos();
      setShowModal(false);
      setInsumoEditando(null);
  } catch (error) {
      console.error("Error al actualizar insumo o crear lote: ", error);
  }}

  // Manejar guardar insumo
  const manejarGuardarInsumo = async (datos) => {
    if (insumoEditando) {
      await editarInsumo({ ...datos, id: insumoEditando.id });
    } else {
      await agregarInsumo(datos);
    }
  };
  // Manejar merma
  const manejarEnvioMerma=async(nuevaMerma)=>{
    try {
      const respuesta=await fetch(`${API_BASE_URL}/api/inventario/rMerma`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(nuevaMerma)
      })
      const datoR=await respuesta.json()
      if (!respuesta.ok) {
        console.error('❌ Error completo:', datoR);
        alert(`Error: ${JSON.stringify(datoR.detail, null, 2)}`);
      } else {
        // Mostrar ingredientes descontados si existen
        if (datoR.ingredientes_descontados) {
          const ingredientesInfo = datoR.ingredientes_descontados
            .map(ing => `• ${ing.ingrediente}: ${ing.cantidad} ${ing.unidad}`)
            .join('\n');
          
          alert(`${datoR.mensaje}\n\nIngredientes descontados:\n${ingredientesInfo}`);
        } else {
          alert(datoR.mensaje);
        }
      }
      await cargarInsumos();
      setShowModalMerma(false)
    }catch (error) {
        console.error('❌ Error de red:', error);
        alert('Error de conexión al servidor');
    }
  };

  // Filtrar insumos
  const categorias = ["Todas", ...new Set(insumos.map(insumo => insumo.categoria))];
  const insumosFiltrados = insumos.filter(insumo =>
    (categoriaFiltro === "Todas" || insumo.categoria === categoriaFiltro) &&
    insumo.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Calcular totales
  const totalInsumos = insumos.length;
  const valorTotal = insumos.reduce((total, i) => total + i.cantidad_actual * i.precio, 0);
  const stockBajo = insumos.filter(i => i.cantidad_actual <= i.minimo).length;
  const categoriasActivas = new Set(insumos.map(i => i.categoria)).size;
  const insumosBajos = insumos.filter(i => i.cantidad_actual <= i.minimo);

  return (
    <Container fluid style={moduleBg} className="py-4">
      {/* Encabezado */}
      <div className={styles.menuHeader} style={headerStyle}>
        <div className="d-flex align-items-center justify-content-between mb-2">
          <h1 className="h2 fw-bold mb-1" style={{color: 'var(--color-title)'}}>
            Gestión de Insumos
          </h1>
          <Badge style={badgeRol}>
            {rol === "admin" ? "👑 Administrador" : "👨‍🍳 Área de Cocina"}
          </Badge>
        </div>
        <p style={{color: 'var(--color-muted)'}} className="mb-1">
          Control de inventario para cevichería
        </p>
      </div>

      {loading && <Alert variant="info">Cargando inventario...</Alert>}
      {error && <Alert variant="danger">Error: {error}</Alert>}

      {insumosBajos.length > 0 && (
        <Alert variant="warning" className="mb-4">
          <Alert.Heading style={{color: 'var(--color-title)'}}>⚠️ Alerta de Stock Bajo</Alert.Heading>
          <div className="mb-2">
            {insumosBajos.map(insumo => (
              <Badge key={insumo.id} bg="warning" text="dark" className="me-2 mb-1">
                {insumo.nombre}: {insumo.cantidad_actual} {insumo.unidad_medida} (Mín: {insumo.minimo})
              </Badge>
            ))}
          </div>
          {rol === "cocina" && (
            <Button variant="outline-warning" size="sm">📞 Notificar al Administrador</Button>
          )}
        </Alert>
      )}

      {/* Cards */}
      <Row className="mb-4">
        <Col md={3} className="mb-3">
          <Card className="h-100" style={cardStyle}>
            <Card.Body className="text-center">
              <div className="mb-2" style={{color: 'var(--color-accent)', fontSize: '1.5rem'}}>📦</div>
              <Card.Title className="fs-6" style={{color: 'var(--color-text)'}}>Total Insumos</Card.Title>
              <h3 style={{color: 'var(--color-accent)'}}>{totalInsumos}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="h-1000" style={cardStyle}>
            <Card.Body className="text-center">
              <div className="mb-2" style={{color: 'var(--color-secondary)', fontSize: '1.5rem'}}>💰</div>
              <Card.Title className="fs-6" style={{color: 'var(--color-text)'}}>Valor Total</Card.Title>
              <h3 style={{color: 'var(--color-secondary)'}}>S/ {valorTotal.toFixed(2)}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="h-100" style={cardStyle}>
            <Card.Body className="text-center">
              <div className="mb-2" style={{color: 'var(--color-btn-delete)', fontSize: '1.5rem'}}>⚠️</div>
              <Card.Title className="fs-6" style={{color: 'var(--color-text)'}}>Stock Bajo</Card.Title>
              <h3 style={{color: 'var(--color-btn-delete)'}}>{stockBajo}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="h-100" style={cardStyle}>
            <Card.Body className="text-center">
              <div className="mb-2" style={{color: 'var(--color-accent)', fontSize: '1.5rem'}}>🏷️</div>
              <Card.Title className="fs-6" style={{color: 'var(--color-text)'}}>Categorías</Card.Title>
              <h3 style={{color: 'var(--color-accent)'}}>{categoriasActivas}</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filtros */}
      <Card className="mb-4" style={cardStyle}>
        <Card.Body>
          <Row>
            <Col md={4}>
              <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="🔍 Buscar por nombre o categoría..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    style={inputStyle}
                  />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select 
                  value={categoriaFiltro} 
                  onChange={(e) => setCategoriaFiltro(e.target.value)}
                  style={inputStyle}
              >
                  {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </Form.Select>
            </Col>
            <Col md={5} className="text-end">
              {rol === "admin" && (<>
                <Button style={btnPrimary} onClick={() => { setInsumoEditando(null); setShowModal(true); }} className="px-4 me-2">
                  ➕ Agregar Insumo
                </Button>
                <Button style={btnSecondary} onClick={()=>{setShowModalMovimientos(true)}}>
                  📊 Ver movimientos
                </Button>
                </>
              )}
              {rol === "cocina" && (
                <Button style={btnWarning} onClick={() => { setRegistroMerma(null); setShowModalMerma(true); }} className="px-4">
                  🗑️ Registrar Merma
                </Button>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {/* Tabla */}
      <Card style={cardStyle}>
        <Card.Header style={headerStyle}>
          <h5 className="mb-0" style={{color: 'var(--color-title)'}}>📋 Lista de Insumos</h5>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0 align-middle text-center" style={{backgroundColor: 'var(--color-bg)'}}>
            <thead style={{backgroundColor: 'var(--color-header)'}}>
              <tr>
                <th style={{color: 'var(--color-title)'}}>Insumo</th>
                <th style={{color: 'var(--color-title)'}}>Cantidad</th>
                <th style={{color: 'var(--color-title)'}}>Precio</th>
                <th style={{color: 'var(--color-title)'}}>Descripción</th>
                <th style={{color: 'var(--color-title)'}}>Valor Total</th>
                <th style={{color: 'var(--color-title)'}}>¿Es perecible?</th>
                {rol === "admin" && <th width="200" style={{color: 'var(--color-title)'}}>Acción</th>}
              </tr>
            </thead>
            <tbody>
              {insumosFiltrados.map(insumo => {
                const estaBajoStock = insumo.cantidad_actual <= insumo.minimo;
                return (
                  <tr key={insumo.id} style={{ 
                      backgroundColor: estaBajoStock ? 'var(--color-warning-light)' : 'transparent',
                      color: 'var(--color-text)'
                    }}
                  >
                    <td>
                      <div>
                        <strong>{insumo.nombre}</strong>
                        {estaBajoStock && <Badge bg="warning" text="dark" className="ms-2">Stock Bajo</Badge>}
                      </div>
                      <small style={{color: 'var(--color-muted)'}}>Unidad: {insumo.unidad_medida}</small>
                    </td>
                    <td>
                      <span style={{color: estaBajoStock ? 'var(--color-btn-delete)' : 'var(--color-secondary)', fontWeight: 'bold'}}>
                        {insumo.cantidad_actual} {insumo.unidad_medida}
                      </span>
                      <br />
                      <small style={{color: 'var(--color-muted)'}}>Mín: {insumo.minimo} {insumo.unidad_medida}</small>
                    </td>
                    <td style={{color: 'var(--color-bg)'}}>S/ {insumo.precio.toFixed(2)}</td>
                    <td>
                      <Badge style={{backgroundColor: 'var(--color-muted)', color: 'white'}}>{insumo.categoria}</Badge>
                    </td>
                    <td>
                      <strong style={{color: 'var(--color-accent)'}}>S/ {(insumo.cantidad_actual * insumo.precio).toFixed(2)}</strong>
                    </td>
                    <td>
                      <strong style={{color: 'var(--color-bg)'}}>{insumo.perecible ? "Sí" : "No"}</strong>
                    </td>
                    {rol === "admin" && (
                      <td>
                        <div className="d-flex gap-2">
                          <Button 
                            style={btnWarning}
                            size="sm" 
                            onClick={() => { setInsumoEditando(insumo); setShowModal(true); }}
                          >
                            ✏️ Editar
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </Table>

          {insumosFiltrados.length === 0 && !loading && (
            <div className="text-center py-5" style={{color: 'var(--color-muted)'}}>
              <div>📭 No se encontraron insumos</div>
              {rol === "admin" && (
                <Button style={btnPrimary} size="sm" className="mt-2" onClick={() => setShowModal(true)}>
                  Agregar primer insumo
                </Button>
              )}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modales */}
      <Modal show={showModalMerma} onHide={()=>{setShowModalMerma(false);setRegistroMerma(null)}} centered>
          <div style={cardStyle}>
            <Modal.Header style={headerStyle}>
              <Modal.Title style={{color: 'var(--color-title)'}}>🗑️ Registro de Mermas</Modal.Title>
              <button 
                type="button" 
                className="btn-close" 
                onClick={()=>{setShowModalMerma(false);setRegistroMerma(null)}} 
                style={{ filter: 'var(--logo-filter)'}}
              >
              </button>
            </Modal.Header>
            <Modal.Body style={{backgroundColor: 'var(--color-bg)', color: 'var(--color-text)'}}>
              <FormMermas 
                empleadoId={empleadoId} merma={registroMerma} 
                onGuardar={manejarEnvioMerma} 
                onCancelar={()=>{setShowModalMerma(false),setRegistroMerma(null)}} 
              />
            </Modal.Body>
          </div>
      </Modal>

      <Modal show={showModal} onHide={() => { setShowModal(false); setInsumoEditando(null); }} centered>
        <div style={cardStyle}>
          <Modal.Header style={headerStyle}>
            <Modal.Title style={{color: 'var(--color-title)'}}>
              {insumoEditando ? "✏️ Editar Insumo" : "➕ Agregar Nuevo Insumo"}
            </Modal.Title>
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => { setShowModal(false); setInsumoEditando(null); }} 
              style={{ filter: 'var(--logo-filter)'}}
            >
            </button>
          </Modal.Header>
          <Modal.Body style={{backgroundColor: 'var(--color-bg)', color: 'var(--color-text)'}}>
              <FormInsumo   
                empleadoId={empleadoId} 
                insumo={insumoEditando} 
                onGuardar={manejarGuardarInsumo} 
                onCancelar={() => { setShowModal(false); setInsumoEditando(null); }} 
              />
          </Modal.Body>
        </div>
      </Modal>

      <Modal show={showModalMovimientos} onHide={()=>{setShowModalMovimientos(false)}} centered size="lg">
          <div style={cardStyle}>
              <Modal.Header style={headerStyle}>
                <Modal.Title style={{color: 'var(--color-title)'}}>Historial de movimientos</Modal.Title>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={()=>{setShowModalMovimientos(false)}} 
                  style={{ filter: 'var(--logo-filter)'}}
                >
                </button>
              </Modal.Header>
              <Modal.Body style={{backgroundColor: 'var(--color-bg)', color: 'var(--color-text)', maxHeight: '70vh', overflowY: 'auto'}}>
                  <HistorialMovimientos />
              </Modal.Body>
          </div>
      </Modal>
    </Container>
  );
}

function FormMermas({merma, empleadoId, onGuardar, onCancelar}){
  const [formInfo, setformInfo] = useState({
      platillo_id:merma?.platillo_id||"",
      cantidad:merma?.cantidad|| "",
      motivo:merma?.motivo|| ""
  })
  const [platillos,setPlatillos] = useState([])

  useEffect(()=> {
      fetch("http://127.0.0.1:8000/pedidosF/platillos")
        .then((res) => res.json())
        .then((data) => {
          setPlatillos(data);      
          console.log("🍽️ Platillos cargados:", data);
          data.forEach(p => {
            console.log(`- ${p.nombre}: ID = ${p.id}`);
          });
        })
        .catch((err) => console.error(err));
  }, [])

  const manejarEnvio=(e)=>{
    e.preventDefault();
    const datosLimpios = {
      platillo_id: Number(formInfo.platillo_id),
      cantidad: Number(formInfo.cantidad),
      motivo: formInfo.motivo.trim(),
      empleado_id: empleadoId || null
  };  
  onGuardar(datosLimpios);
};

 const inputStyle = { 
    backgroundColor: 'var(--color-bg)', 
    color: 'var(--color-text)', 
    borderColor: 'var(--color-muted)' 
  };

  const btnPrimary = { 
    backgroundColor: 'var(--color-btn)', 
    borderColor: 'var(--color-btn)', 
    color: 'white', 
    fontWeight: 'bold' 
  };

  const btnSecondary = { 
    backgroundColor: 'var(--color-muted)', 
    borderColor: 'var(--color-muted)', 
    color: 'white'
  };

return(
  <Form onSubmit={manejarEnvio}>
      <Form.Group className="mb-3">
          <Form.Label style={{color: 'var(--color-text)'}}>Selecciona el platillo:</Form.Label>
        <Form.Select 
          style={inputStyle}
          value={formInfo.platillo_id} 
          onChange={(e)=>setformInfo({...formInfo,platillo_id:e.target.value})} 
        >
          <option value="">Selecciona un platillo...</option>
          {platillos.map((platillo)=>(
              <option key={platillo.id} value={platillo.id}>{platillo.nombre}</option>
          ))}
        </Form.Select>

        <Form.Label style={{color: 'var(--color-text)'}} className="mt-3">Selecciona la cantidad:</Form.Label>
        <Form.Control 
          type="number" 
          className="form-control w-25" 
          value={formInfo.cantidad}   
          onChange={(e) => setformInfo({...formInfo,cantidad:Number(e.target.value)})} 
          required 
          min="1" 
        />
        <Form.Label style={{color: 'var(--color-text)'}} className="mt-3">Establece el motivo:</Form.Label>
        <Form.Control 
          as="textarea" 
          style={inputStyle}
          rows={3} 
          value={formInfo.motivo}  
          onChange={(e)=>setformInfo({...formInfo,motivo:e.target.value})} 
          required
        />
      </Form.Group>
      <div className="d-flex justify-content-end gap-2">
        <Button style={btnSecondary} onClick={onCancelar}>Cancelar</Button>
        <Button style={btnPrimary} type="submit">Registrar Merma</Button>
      </div>
  </Form>
  );
}

function FormInsumo({ insumo,empleadoId, onGuardar, onCancelar }) {
  const [formData, setFormData] = useState({
    nombre: insumo?.nombre || "",
    cantidad: insumo?.cantidad_actual || "",
    precio: insumo?.precio || 0,
    categoria: insumo?.categoria || "Pescados",
    unidad: insumo?.unidad_medida || "kg",
    minimo: insumo?.minimo || 0,
    perecible: insumo?.perecible ?? false,
  });

  const categorias = ["Pescados", "Mariscos", "Frutas", "Verduras", "Tubérculos", "Granos", "Condimentos", "Hierbas", "Otros"];
  const unidades = ["kg", "gr", "litro", "unidad", "hojas", "paquete", "caja"];

  const inputStyle = { 
    backgroundColor: 'var(--color-bg)', 
    color: 'var(--color-text)', 
    borderColor: 'var(--color-muted)' 
  };

  const btnPrimary = { 
    backgroundColor: 'var(--color-btn)', 
    borderColor: 'var(--color-btn)', 
    color: 'white', 
    fontWeight: 'bold' 
  };

  const btnSecondary = { 
    backgroundColor: 'var(--color-muted)', 
    borderColor: 'var(--color-muted)', 
    color: 'white'
  };

  const manejarEnvio = (e) => {
    e.preventDefault();
    const cantidadNueva = parseFloat(formData.cantidad);
    const cantidadOriginal = parseFloat(insumo?.cantidad_actual || 0);
    const diferencia = cantidadNueva - cantidadOriginal;

    if (!empleadoId) {
      alert('Error: No se pudo identificar al empleado. Por favor, vuelva a iniciar sesión.');
      return;
    }

    onGuardar({
      ...formData,
      cantidad: parseFloat(formData.cantidad),
      precio: parseFloat(formData.precio),
      minimo: parseFloat(formData.minimo),
      diferencia:diferencia,
      empleado_id: empleadoId || null
    });
  };

  return (
    <Form onSubmit={manejarEnvio}>
      <Form.Group className="mb-3">
        <Form.Label style={{color: 'var(--color-text)'}}>Nombre del Insumo</Form.Label>
        <Form.Control
          type="text"
          style={inputStyle}
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          placeholder="Ej: Pescado, Limón, Cebolla, etc."
          required
        />
      </Form.Group>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label style={{color: 'var(--color-text)'}}>Cantidad Actual</Form.Label>
            <Form.Control
              type="number"
              style={inputStyle}
              value={formData.cantidad}
              onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
              min="0"
              required
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label style={{color: 'var(--color-text)'}}>Stock Mínimo</Form.Label>
            <Form.Control
              type="number"
              style={inputStyle}
              value={formData.minimo}
              onChange={(e) => setFormData({ ...formData, minimo: e.target.value })}
              min="0"
              required
            />
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label style={{color: 'var(--color-text)'}}>Precio Unitario (S/) *</Form.Label>
            <Form.Control
              type="number"
              style={inputStyle}
              step="0.01"
              value={formData.precio}
              onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
              min="0"
              required
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label style={{color: 'var(--color-text)'}}>Unidad de Medida</Form.Label>
            <Form.Select 
              style={inputStyle}
              value={formData.unidad} 
              onChange={(e) => setFormData({ ...formData, unidad: e.target.value })} 
              required
            >
              {unidades.map(unidad => <option key={unidad} value={unidad}>{unidad}</option>)}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-4">
        <Form.Label style={{color: 'var(--color-text)'}}>Categoría</Form.Label>
        <Form.Select
          style={inputStyle}
          value={formData.categoria} 
          onChange={(e) => setFormData({ ...formData, categoria: e.target.value })} 
          required
        >
          {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </Form.Select>
      </Form.Group>

      <Form.Group className="mb-4">
        <Form.Label style={{color: 'var(--color-text)'}}>¿Es perecible? *</Form.Label>
        <Form.Select 
          style={inputStyle}
          value={formData.perecible ? "true" : "false"} 
          onChange={(e) => setFormData({ ...formData, perecible: e.target.value === "true" })} 
          required
        >
          <option value="true">Sí</option>
          <option value="false">No</option>
        </Form.Select>
      </Form.Group>

      <div className="d-flex gap-2 justify-content-end">
        <Button style={btnSecondary} onClick={onCancelar}>Cancelar</Button>
        <Button style={btnPrimary} type="submit">{insumo ? "Actualizar" : "Guardar Insumo"}</Button>
      </div>
    </Form>
  );
}

function HistorialMovimientos() {
  const [ingredientes, setIngredientes] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [ingredienteSeleccionado, setIngredienteSeleccionado] = useState("");
  const [loading, setLoading] = useState(false);

  const inputStyle = { 
    backgroundColor: 'var(--color-bg)', 
    color: 'var(--color-text)', 
    borderColor: 'var(--color-muted)' 
  };

  const cargarIngredientes = async () => {
    try {
      const respuesta = await fetch(`${API_BASE_URL}/inventario_L/ingredientes-con-lotes`);
      if (!respuesta.ok) throw new Error("Error al cargar ingredientes");
      const datos = await respuesta.json();
      setIngredientes(datos);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const formatearFecha = (fechaISO) => {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const mostrarMovimientos = async (ingredienteId = null) => {
    setLoading(true);
    try {
      const url = ingredienteId 
        ? `${API_BASE_URL}/inventario_L/lotes/ingrediente/?ingrediente_id=${ingredienteId}`
        : `${API_BASE_URL}/inventario_L/movimientos/historial`;
      const respuesta = await fetch(url);

      if (respuesta.status === 404) {
        setHistorial([]);
        return;
      }
      
      // Verificar si la respuesta es OK
      if (!respuesta.ok) {
        throw new Error("Error al cargar historial");
      }
      
      const datos = await respuesta.json();
      setHistorial(datos);
      
    } catch (err) {
      console.error("Error al cargar el historial:", err);
      setHistorial([]);
    } finally {
      setLoading(false);
    }
  };

  const filtrarPorIngredientes = (ingredienteId) => {
    setIngredienteSeleccionado(ingredienteId);
    
    if (!ingredienteId || ingredienteId === "") {
      mostrarMovimientos();
    } else {
      mostrarMovimientos(parseInt(ingredienteId));
    }
  };

  useEffect(() => {
    cargarIngredientes();
    mostrarMovimientos();
  }, []);

  return (
    <>
      <Form className="mb-3">
        <Form.Group>
          <Form.Label style={{color: 'var(--color-text)'}}>Filtrar por ingrediente:</Form.Label>
          <Form.Select 
            style={inputStyle}
            value={ingredienteSeleccionado} 
            onChange={(e) => filtrarPorIngredientes(e.target.value)}
            disabled={loading}
          >
            <option value="">-- Todos los ingredientes --</option>
            {ingredientes.map((ingrediente) => (
              <option key={ingrediente.id} value={ingrediente.id}>
                {ingrediente.nombre}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      </Form>

      {loading && (
        <Alert variant="info" className="mb-3">
          Cargando movimientos...
        </Alert>
      )}

      {!loading && ingredienteSeleccionado && (
        <Alert variant="info" className="mb-3">
          Mostrando {historial.length} movimiento(s) de{' '}
          {ingredientes.find(i => i.id === parseInt(ingredienteSeleccionado))?.nombre}
        </Alert>
      )}

      <Table striped bordered hover className="w-100" style={{backgroundColor: 'var(--color-bg)', color: 'var(--color-text)'}}>
        <thead style={{backgroundColor: 'var(--color-header)'}}>
          <tr>
            <th style={{color: 'var(--color-title)'}}>Lote #</th>
            <th style={{color: 'var(--color-title)'}}>Empleado</th>
            <th style={{color: 'var(--color-title)'}}>Tipo</th>
            <th style={{color: 'var(--color-title)'}}>Ingrediente</th>
            <th style={{color: 'var(--color-title)'}}>Cantidad</th>
            <th style={{color: 'var(--color-title)'}}>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {historial.length === 0 && !loading ? (
            <tr>
              <td colSpan="6" className="text-center text-muted py-3">
                {ingredienteSeleccionado 
                  ? "No hay movimientos para este ingrediente"
                  : "No hay movimientos registrados"
                }
              </td>
            </tr>
          ) : (
            historial.map((historia) => (
              <tr key={historia.id}>
                <td>{historia.id}</td>
                <td>{historia.nombre_empleado}</td>
                <td>
                  <Badge bg={
                    historia.tipo_movimiento === 'consumo' ? 'warning' :
                    historia.tipo_movimiento === 'merma' ? 'danger' :
                    'info'
                  }>
                    {historia.tipo_movimiento}
                  </Badge>
                </td>
                <td>{historia.nombre_ingrediente}</td>
                <td>{parseFloat(historia.cantidad).toFixed(2)}</td>
                <td>{formatearFecha(historia.fecha_hora)}</td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </>
  );
}

export default Insumos;