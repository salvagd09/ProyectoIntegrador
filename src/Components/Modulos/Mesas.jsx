import { useState, useEffect } from "react";
import { Container, Button, Form, Row, Col, Modal, Card } from "react-bootstrap";

import styles from './Mesas.module.css';

function Mesas() {
    // Constante de rol de usuario
    const rol = localStorage.getItem("userRole");
    // Constantes de mesa
    const [numeroMesa, setNumeroMesa] = useState("");
    const [cantidadMesa, setCantidadMesa] = useState("");
    const [mesas, setMesas] = useState([]);
    const [showModalA, setShowModalA] = useState(false);
    const [showModalEditList, setShowModalEditList] = useState(false);
    //Estados de Edición
    const [mesaAEditar, setMesaAEditar] = useState(null);
    const [editNumeroMesa, setEditNumeroMesa] = useState('');
    const [editCantidadMesa, setEditCantidadMesa] = useState('');
    const [editMesaId, setEditMesaId] = useState(null);
    //Estados de Alerta
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(true);
    const [confirmAction, setConfirmAction] = useState(() => () => {});
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
    
    const btnAdd = { 
        backgroundColor: 'var(--color-accent)', 
        borderColor: 'var(--color-accent)', 
        color: 'white', fontWeight: 'bold' 
        };
        
    const btnDelete = { 
        backgroundColor: 'var(--color-accent)', 
        borderColor: 'var(--color-accent)', 
        color: 'white', fontWeight: 'bold' 
        };
    const btnSecondary = { 
        backgroundColor: 'var(--color-muted)', 
        borderColor: 'var(--color-muted)', 
        color: 'white' 
        };
    // Color de estado de mesa
    const status_colors = {
        libre: { bgColor: 'var(--color-secondary)', txtColor: 'var(--color-title)' },
        ocupada: { bgColor: 'var(--color-btn-delete)', txtColor: 'white' },
    };
    // Helper para cargar datos de mesa
    const handleSelectMesaForEdit = (mesaId) => {
        const mesa = mesas.find(m => m.id === parseInt(mesaId));
        if (mesa) {
            setMesaAEditar(mesa);
            setEditNumeroMesa(mesa.numero);
            setEditCantidadMesa(mesa.capacidad);
            setEditMesaId(mesa.id);
        } else {
            setMesaAEditar(null);
            setEditNumeroMesa('');
            setEditCantidadMesa('');
            setEditMesaId(null);
        }
    };
    // Modal de alerta
    const showMessageModal = (message, success = true, action = () => setShowConfirmModal(false)) => {
        setConfirmMessage(message);
        setIsSuccess(success);
        setConfirmAction(() => action);
        setShowConfirmModal(true);
    };
    // Función de actualización de mesas
    const fetchMesas = () => {
        fetch("http://127.0.0.1:8000/mesas/")
            .then((res) => res.json())
            .then((data) => setMesas(data))
            .catch((err) => console.error(err));
    };

    useEffect(() => {
        fetchMesas();
    }, []);

    function ocupar(mesa) {
        const nuevoEstado = mesa.estado === "libre" ? "ocupada" : "libre";

        fetch(`http://127.0.0.1:8000/mesas/${mesa.id}/estado?estado=${nuevoEstado}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
        })
        .then((res) => {
            if (!res.ok) throw new Error("Fallo al cambiar el estado");
            return res.json();
        })
        .then((mesaActualizada) => {
            setMesas((prevMesas) =>
            prevMesas.map((m) =>
                m.id === mesaActualizada.id ? mesaActualizada : m
            )
            );
            showMessageModal(`Mesa ${mesaActualizada.numero} marcada como ${mesaActualizada.estado.toUpperCase()}`, true);
        })
        .catch((err) => {
            console.error(err);
            showMessageModal("Error al cambiar estado de mesa", false);
        });  
    }

    function agregarMesa() {
        if (!numeroMesa || !cantidadMesa) {
            showMessageModal("Por favor, rellene todos los campos", false);
            return;
        };
        const nuevaMesa = { numero: numeroMesa, capacidad: cantidadMesa, estado: "libre" };
        fetch("http://127.0.0.1:8000/mesas/agregarM", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevaMesa),
        })
        .then((res) => {
            if (!res.ok) throw new Error("Fallo al agregar mesa. El número de mesa podría ya existir");
            return res.json();
        })
        .then(() => {
            setShowModalA(false);
            fetchMesas(); 
            showMessageModal(`Mesa ${numeroMesa} agregada correctamente`, true);
            setNumeroMesa(""); setCantidadMesa("");
        })
        .catch((err) => {
            setShowModalA(false);
            console.error(err);
            showMessageModal(`Error al agregar mesa`, false);
        });
    }

    async function guardarEdicionMesa() {
        if (!editMesaId || !editNumeroMesa || !editCantidadMesa) {
            showMessageModal("Selecciona una mesa y rellena los campos", false);
            return;
        }

        const datosActualizados = {
            numero: editNumeroMesa,
            capacidad: parseInt(editCantidadMesa),
        };

        const url = `http://127.0.0.1:8000/mesas/${editMesaId}/editar`;

        // Lógica de FETCH
        try { 
            const response = await fetch(url, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(datosActualizados),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Error desconocido al actualizar");
            }

            fetchMesas();
            showMessageModal(`Mesa ${editNumeroMesa} actualizada correctamente`, true);
            setShowModalEditList(false);
        } catch (err) { 
            setShowModalEditList(false);
            console.error("Error al guardar edición:", err);
            showMessageModal(`Error: ${err.message}`, false);
        }
    }

    const mesasVisibles = rol == 1 || rol == 4 ? mesas : mesas.filter((m) => m.estado === "ocupada");

    return (
        <Container className="py-2" style={{backgroundColor: 'var(--color-bg)', color: 'var(--color-text)'}}>
        {/* Encabezado */}
        <div className={`mb-4 d-flex justify-content-between align-items-center ${styles.moduleHeader}`}>
            <h1 className="fs-1 m-0 fw-bold" style={{ color: 'var(--color-title)', fontFamily: 'var(--font-basic)' }}>
            Gestión de Mesas
            </h1>
            {rol == 4 && (
                <div> 
                    <Button 
                        style={{...btnAdd, marginRight: '10px'}} 
                        onClick={() => setShowModalEditList(true)}
                    >
                        <i className="fa-solid fa-pen me-2"></i> Editar Mesas
                    </Button>
                    <Button style={btnAdd} onClick={() => setShowModalA(true)}>
                        <i className="fa-solid fa-chair me-2"></i> Agregar Mesa
                    </Button>
                </div>
            )}
        </div>
        {/* Descripción */}
        <p className="mb-4" style={{color: 'var(--color-muted)'}}>
            {rol == 1 || rol == 4
                ? "Mesas disponibles y ocupadas para la gestión de pedidos" 
                : "Vista general y administración de todas las mesas del local"
            }
        </p>

        {/* Agrupación de Mesas */}
        <div className={styles.mesasGrid}>
            {mesasVisibles.length === 0 ? (
                <p style={{color: 'var(--color-muted)'}}>No hay mesas validas para este rol</p>
            ) : (
                mesasVisibles.map((mesa) => {
                    const estadoColor = status_colors[mesa.estado] || status_colors.libre;
                            
                    return (
                        <div key={mesa.id} className={styles.mesaCard} style={cardStyle}>
                            {/* Encabezado */}
                            <div className={styles.mesaHeader} style={{backgroundColor: estadoColor.bgColor, color: estadoColor.txtColor}}>
                                <h5 className="m-0 fw-bold">Mesa {mesa.numero}</h5>
                            </div>
                                    
                            <div className={styles.mesaBody}>
                                <div className="mb-3">
                                    <i className="fa-solid fa-users me-2" style={{color: 'var(--color-accent)'}}></i>
                                    Capacidad: <strong>{mesa.capacidad}</strong> personas
                                </div>
                                        
                                <div className="mb-4">
                                    Estado: 
                                    <span className={`ms-1 fw-bolder ${mesa.estado === 'libre' ? styles.statusLibre : styles.statusOcupada}`}>
                                        {mesa.estado.toUpperCase()}
                                    </span>
                                </div>
                                    
                                {/* Botón de Acción (Solo Mesero) */}
                                {rol == 1 && (
                                    <Button
                                        type="button"
                                        className={styles.actionButton}
                                        onClick={() => ocupar(mesa)}
                                        style={{
                                            backgroundColor: mesa.estado === "libre" ? btnAdd.backgroundColor : btnDelete.backgroundColor,
                                            borderColor: mesa.estado === "libre" ? btnAdd.borderColor : btnDelete.borderColor,
                                            color: 'white',
                                        }}
                                    >
                                        {mesa.estado === "libre" ? "Marcar Ocupada" : "Marcar Libre"}
                                    </Button>
                                )}
                            </div>
                        </div>
                    );
                })
            )}
        </div>

        {/* Modal Agregar */}
        {showModalA && (
            <>
                <div className={`${styles.modalOverlay} d-flex align-items-center justify-content-center`}>
                    <div className={styles.modalContentSmall} style={cardStyle}> 
                        <div className={styles.modalHeader} style={headerStyle}>
                            <h5 style={{color: 'var(--color-title)'}}>Ingrese los datos de la mesa</h5>
                            <button type="button" className="btn-close" onClick={() => setShowModalA(false)} style={{ filter: 'var(--logo-filter)'}}></button>
                        </div>
                        <div className={styles.modalBody}>
                            <Form onSubmit={(e) => { e.preventDefault(); agregarMesa(); }}>
                                    
                                <Form.Group className="mb-3">
                                    <Form.Label style={{ color: 'var(--color-text)' }}>Número/Nombre de la mesa:</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={numeroMesa}
                                        onChange={(e) => setNumeroMesa(e.target.value)}
                                        style={inputStyle}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label style={{ color: 'var(--color-text)' }}>Capacidad (personas):</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="1"
                                        value={cantidadMesa}
                                        onChange={(e) => setCantidadMesa(e.target.value)}
                                        style={inputStyle}
                                        required
                                    />
                                </Form.Group>
                                        
                                <div className={styles.modalFooter} style={{ borderTop: 'none', padding: '1rem 0 0' }}>
                                    <Button style={btnSecondary} onClick={() => setShowModalA(false)} className="me-2">Cancelar</Button>
                                    <Button type="submit" style={btnAdd}>Guardar Mesa</Button>
                                </div>
                            </Form>
                        </div>
                    </div>
                </div>
                <div className={styles.modalBackdrop} onClick={() => setShowModalA(false)}></div>
            </>
        )}
        {/* Modal Editar */}
        {showModalEditList && (
            <>
                <div className={`${styles.modalOverlay} d-flex align-items-center justify-content-center`}>
                    <div className={styles.modalContentWide} style={cardStyle}> 
                        <div className={styles.modalHeader} style={headerStyle}>
                            <h5 style={{color: 'var(--color-title)'}}>Editar Mesas Existentes</h5>
                            <button type="button" className="btn-close" onClick={() => setShowModalEditList(false)} style={{ filter: 'var(--logo-filter)' }} aria-label="Close"></button>
                        </div>
                        <div className={styles.modalBody}>
                            <Form>
                                {/* 1. Selector de Mesa */}
                                <Form.Group className="mb-4">
                                    <Form.Label style={{ color: 'var(--color-text)' }}>Seleccionar Mesa a Editar:</Form.Label>
                                    <Form.Select 
                                        style={inputStyle}
                                        value={editMesaId || ''}
                                        onChange={(e) => handleSelectMesaForEdit(e.target.value)}
                                    >
                                        <option value="">-- Selecciona Mesa --</option>
                                        {mesas.map(m => (
                                            <option key={m.id} value={m.id}>Mesa {m.numero} ({m.estado})</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>

                                {/* 2. Formulario de Edición (Solo si hay mesa seleccionada) */}
                                {mesaAEditar && (
                                    <Card style={{...cardStyle, border: `1px solid var(--color-accent)`}} className="mt-4 p-3">
                                        <Card.Title style={{color: 'var(--color-accent)'}} className="mb-3">Datos de Mesa {mesaAEditar.numero}</Card.Title>
                                        <Row>
                                            <Col md={6} className="mb-3">
                                                <Form.Label style={{ color: 'var(--color-text)' }}>Nuevo Número/Nombre:</Form.Label>
                                                <Form.Control type="text" value={editNumeroMesa} onChange={(e) => setEditNumeroMesa(e.target.value)} style={inputStyle} required />
                                            </Col>
                                            <Col md={6} className="mb-3">
                                                <Form.Label style={{ color: 'var(--color-text)' }}>Nueva Capacidad:</Form.Label>
                                                <Form.Control type="number" min="1" value={editCantidadMesa} onChange={(e) => setEditCantidadMesa(e.target.value)} style={inputStyle} required />
                                            </Col>
                                        </Row>
                                    </Card>
                                )}

                            </Form>
                        </div>
                        <div className={styles.modalFooter} style={headerStyle}>
                            <Button style={btnSecondary} onClick={() => setShowModalEditList(false)}>Cerrar</Button>
                            <Button 
                                style={btnAdd} 
                                onClick={guardarEdicionMesa} 
                                disabled={!mesaAEditar || mesaAEditar.numero === editNumeroMesa && mesaAEditar.capacidad === parseInt(editCantidadMesa)}
                            >
                                Guardar Cambios
                            </Button>
                        </div>
                    </div>
                </div>
                <div className={styles.modalBackdrop} onClick={() => setShowModalEditList(false)}></div>
            </>
        )}
        {/* Modal Alerta */}
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
export default Mesas;
