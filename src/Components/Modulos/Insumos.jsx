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
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

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

    await fetch(`${API_BASE_URL}/api/inventario/${insumoActualizado.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datosParaBackend)
    });

    await cargarInsumos();
    setShowModal(false);
    setInsumoEditando(null);
  };

  // Eliminar insumo
  const eliminarInsumo = async (id) => {
    if (!window.confirm("¿Está seguro de eliminar este insumo?")) return;
    
    await fetch(`${API_BASE_URL}/api/inventario/${id}`, {
      method: 'DELETE'
    });

    await cargarInsumos();
  };

  // Manejar guardar insumo
  const manejarGuardarInsumo = async (datos) => {
    if (insumoEditando) {
      await editarInsumo({ ...datos, id: insumoEditando.id });
    } else {
      await agregarInsumo(datos);
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
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <p className="text-muted">📦 Control de inventario para cevichería</p>
            </div>
            <Badge bg={rol === "admin" ? "primary" : "success"}>
              {rol === "admin" ? "👑 Administrador" : "👨‍🍳 Área de Cocina"}
            </Badge>
          </div>
        </Col>
      </Row>

      {loading && <Alert variant="info">Cargando inventario...</Alert>}
      {error && <Alert variant="danger">Error: {error}</Alert>}

      {insumosBajos.length > 0 && (
        <Alert variant="warning" className="mb-4">
          <Alert.Heading>⚠️ Alerta de Stock Bajo</Alert.Heading>
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

      <Row className="mb-4">
        <Col md={3} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="text-primary mb-2">📦</div>
              <Card.Title className="fs-6">Total Insumos</Card.Title>
              <h3 className="text-primary">{totalInsumos}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="text-success mb-2">💰</div>
              <Card.Title className="fs-6">Valor Total</Card.Title>
              <h3 className="text-success">S/ {valorTotal.toFixed(2)}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="text-warning mb-2">⚠️</div>
              <Card.Title className="fs-6">Stock Bajo</Card.Title>
              <h3 className="text-warning">{stockBajo}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="text-info mb-2">🏷️</div>
              <Card.Title className="fs-6">Categorías</Card.Title>
              <h3 className="text-info">{categoriasActivas}</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Control
                type="text"
                placeholder="🔍 Buscar por nombre o categoría..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </Col>
            <Col md={3}>
              <Form.Select value={categoriaFiltro} onChange={(e) => setCategoriaFiltro(e.target.value)}>
                {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </Form.Select>
            </Col>
            <Col md={5} className="text-end">
              {rol === "admin" && (
                <Button variant="primary" onClick={() => { setInsumoEditando(null); setShowModal(true); }} className="px-4">
                  ➕ Agregar Insumo
                </Button>
              )}
              {rol === "cocina" && (
                <Button variant="secondary" onClick={() => { setInsumoEditando(null); setShowModal(true); }} className="px-4">
                  Registrar Merma
                </Button>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white border-0">
          <h5 className="mb-0">📋 Lista de Insumos</h5>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead className="bg-light">
              <tr>
                <th>Insumo</th>
                <th>Cantidad</th>
                <th>Precio</th>
                <th>Categoría</th>
                <th>Valor Total</th>
                <th>¿Es perecible?</th>
                {rol === "admin" && <th width="200">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {insumosFiltrados.map(insumo => {
                const estaBajoStock = insumo.cantidad_actual <= insumo.minimo;
                return (
                  <tr key={insumo.id} className={estaBajoStock ? "table-warning" : ""}>
                    <td>
                      <div>
                        <strong>{insumo.nombre}</strong>
                        {estaBajoStock && <Badge bg="warning" text="dark" className="ms-2">Stock Bajo</Badge>}
                      </div>
                      <small className="text-muted">Unidad: {insumo.unidad_medida}</small>
                    </td>
                    <td>
                      <span className={estaBajoStock ? "text-danger fw-bold" : "text-success"}>
                        {insumo.cantidad_actual} {insumo.unidad_medida}
                      </span>
                      <br />
                      <small className="text-muted">Mín: {insumo.minimo} {insumo.unidad_medida}</small>
                    </td>
                    <td>S/ {insumo.precio.toFixed(2)}</td>
                    <td><Badge bg="secondary">{insumo.categoria}</Badge></td>
                    <td><strong>S/ {(insumo.cantidad_actual * insumo.precio).toFixed(2)}</strong></td>
                    <td><strong>{insumo.perecible ? "Sí" : "No"}</strong></td>
                    {rol === "admin" && (
                      <td>
                        <div className="d-flex gap-2">
                          <Button variant="outline-primary" size="sm" onClick={() => { setInsumoEditando(insumo); setShowModal(true); }}>
                            ✏️ Editar
                          </Button>
                          <Button variant="outline-danger" size="sm" onClick={() => eliminarInsumo(insumo.id)}>
                            🗑️ Eliminar
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
            <div className="text-center py-5">
              <div className="text-muted">📭 No se encontraron insumos</div>
              {rol === "admin" && (
                <Button variant="outline-primary" size="sm" className="mt-2" onClick={() => setShowModal(true)}>
                  Agregar primer insumo
                </Button>
              )}
            </div>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => { setShowModal(false); setInsumoEditando(null); }} centered>
        <Modal.Header closeButton>
          <Modal.Title>{insumoEditando ? "✏️ Editar Insumo" : "➕ Agregar Nuevo Insumo"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {rol === "admin" ? (
            <FormInsumo insumo={insumoEditando} onGuardar={manejarGuardarInsumo} onCancelar={() => { setShowModal(false); setInsumoEditando(null); }} />
          ) : (
            <div className="text-center p-4">
              <h5>❌ Acceso Denegado</h5>
              <p>No tienes permisos para modificar insumos</p>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
}

function FormInsumo({ insumo, onGuardar, onCancelar }) {
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

  const manejarEnvio = (e) => {
    e.preventDefault();
    onGuardar({
      ...formData,
      cantidad: parseFloat(formData.cantidad),
      precio: parseFloat(formData.precio),
      minimo: parseFloat(formData.minimo),
    });
  };

  return (
    <Form onSubmit={manejarEnvio}>
      <Form.Group className="mb-3">
        <Form.Label>Nombre del Insumo *</Form.Label>
        <Form.Control
          type="text"
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          placeholder="Ej: Pescado, Limón, Cebolla, etc."
          required
        />
      </Form.Group>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Cantidad Actual *</Form.Label>
            <Form.Control
              type="number"
              value={formData.cantidad}
              onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
              min="0"
              required
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Stock Mínimo *</Form.Label>
            <Form.Control
              type="number"
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
            <Form.Label>Precio Unitario (S/) *</Form.Label>
            <Form.Control
              type="number"
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
            <Form.Label>Unidad de Medida *</Form.Label>
            <Form.Select value={formData.unidad} onChange={(e) => setFormData({ ...formData, unidad: e.target.value })} required>
              {unidades.map(unidad => <option key={unidad} value={unidad}>{unidad}</option>)}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-4">
        <Form.Label>Categoría *</Form.Label>
        <Form.Select value={formData.categoria} onChange={(e) => setFormData({ ...formData, categoria: e.target.value })} required>
          {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </Form.Select>
      </Form.Group>

      <Form.Group className="mb-4">
        <Form.Label>¿Es perecible? *</Form.Label>
        <Form.Select value={formData.perecible ? "true" : "false"} onChange={(e) => setFormData({ ...formData, perecible: e.target.value === "true" })} required>
          <option value="true">Sí</option>
          <option value="false">No</option>
        </Form.Select>
      </Form.Group>

      <div className="d-flex gap-2 justify-content-end">
        <Button variant="outline-secondary" onClick={onCancelar}>Cancelar</Button>
        <Button variant="primary" type="submit">{insumo ? "Actualizar" : "Guardar Insumo"}</Button>
      </div>
    </Form>
  );
}

export default Insumos;