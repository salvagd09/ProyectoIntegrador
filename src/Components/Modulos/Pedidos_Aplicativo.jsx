import { useState, useEffect } from 'react';

function Pedidos_Aplicativo() {
  const [pedidos, setPedidos] = useState([]);
  const [estadisticas, setEstadisticas] = useState({});
  const [cargando, setCargando] = useState(true);

  // Obtener pedidos de delivery
  const obtenerPedidos = async () => {
    try {
      const response = await fetch('http://localhost:8000/delivery/pedidos/');
      if (!response.ok) throw new Error('Error al obtener pedidos');
      const data = await response.json();
      setPedidos(data);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cargar pedidos');
    }
  };

  // Obtener estadísticas
  const obtenerEstadisticas = async () => {
    try {
      const response = await fetch('http://localhost:8000/delivery/estadisticas/hoy');
      if (!response.ok) throw new Error('Error al obtener estadísticas');
      const data = await response.json();
      setEstadisticas(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Actualizar estado del pedido
  const actualizarEstado = async (pedidoId, nuevoEstado) => {
    if (!confirm(`¿Cambiar estado a "${nuevoEstado}"?`)) return;
    
    try {
      const response = await fetch(`http://localhost:8000/delivery/pedidos/${pedidoId}/estado`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (response.ok) {
        obtenerPedidos();
        obtenerEstadisticas();
        alert('Estado actualizado correctamente');
      } else {
        throw new Error('Error en la respuesta');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar estado');
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      setCargando(true);
      await Promise.all([obtenerPedidos(), obtenerEstadisticas()]);
      setCargando(false);
    };
    cargarDatos();

    // Actualizar cada 30 segundos
    const intervalo = setInterval(cargarDatos, 30000);
    return () => clearInterval(intervalo);
  }, []);

  if (cargando) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="text-lg">Cargando pedidos de delivery...</div>
      </div>
    );
  }

  // Calcular contadores - TODAS LAS VARIABLES SE USAN
  const pedidosPendientes = pedidos.filter(p => p.pedido.estado === 'Pendiente').length;
  const pedidosPreparacion = pedidos.filter(p => p.pedido.estado === 'En preparacion').length;
  const pedidosListos = pedidos.filter(p => p.pedido.estado === 'Listo').length;
  const pedidosEntregados = pedidos.filter(p => p.pedido.estado === 'Entregado').length;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">🍔 Pedidos por Aplicativo</h1>
        <p className="text-gray-600">Gestión de pedidos desde Rappi, Uber Eats y PedidosYa</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border border-blue-200">
          <h3 className="text-sm font-semibold text-gray-600 uppercase">Total Hoy</h3>
          <p className="text-2xl font-bold text-blue-600">{estadisticas.total_pedidos || 0}</p>
          <p className="text-xs text-gray-500">pedidos delivery</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-yellow-200">
          <h3 className="text-sm font-semibold text-gray-600 uppercase">Pendientes</h3>
          <p className="text-2xl font-bold text-yellow-600">{pedidosPendientes}</p>
          <p className="text-xs text-gray-500">por atender</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-orange-200">
          <h3 className="text-sm font-semibold text-gray-600 uppercase">En Cocina</h3>
          <p className="text-2xl font-bold text-orange-600">{pedidosPreparacion}</p>
          <p className="text-xs text-gray-500">en preparación</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-green-200">
          <h3 className="text-sm font-semibold text-gray-600 uppercase">Listos</h3>
          <p className="text-2xl font-bold text-green-600">{pedidosListos}</p>
          <p className="text-xs text-gray-500">para entregar</p>
        </div>
      </div>

      {/* Estadísticas adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border border-purple-200">
          <h3 className="text-sm font-semibold text-gray-600 uppercase">Ingresos Hoy</h3>
          <p className="text-2xl font-bold text-purple-600">S/ {estadisticas.monto_total || '0.00'}</p>
          <p className="text-xs text-gray-500">total delivery</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-600 uppercase">Entregados</h3>
          <p className="text-2xl font-bold text-gray-600">{pedidosEntregados}</p>
          <p className="text-xs text-gray-500">completados hoy</p>
        </div>
      </div>

      {/* Lista de pedidos */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b bg-gray-50">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              📋 Pedidos Activos ({pedidos.length})
            </h2>
            <button 
              onClick={() => {
                setCargando(true);
                Promise.all([obtenerPedidos(), obtenerEstadisticas()]).finally(() => setCargando(false));
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-2"
            >
              🔄 Actualizar
            </button>
          </div>
        </div>

        {pedidos.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-6xl mb-4">🍕</div>
            <p className="text-lg">No hay pedidos de delivery activos</p>
            <p className="text-sm">Los nuevos pedidos aparecerán aquí automáticamente</p>
          </div>
        ) : (
          <div className="divide-y">
            {pedidos.map(({ pedido, detalles, pago }) => (
              <div key={pedido.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${
                        pedido.plataforma === 'Rappi' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                        pedido.plataforma === 'Uber Eats' ? 'bg-green-100 text-green-800 border border-green-200' :
                        'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {pedido.plataforma}
                      </span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${
                        pedido.estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                        pedido.estado === 'En preparacion' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                        pedido.estado === 'Listo' ? 'bg-green-100 text-green-800 border border-green-200' :
                        pedido.estado === 'Entregado' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                        'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}>
                        {pedido.estado}
                      </span>
                      {pedido.codigo_pedido_externo && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs border rounded">
                          #{pedido.codigo_pedido_externo}
                        </span>
                      )}
                    </div>
                    
                    <h3 className="font-bold text-gray-800 text-lg">{pedido.nombre_cliente}</h3>
                    <p className="text-gray-600 text-sm">📍 {pedido.direccion_cliente}</p>
                    <p className="text-gray-500 text-sm">📞 {pedido.telefono_cliente}</p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-800">S/ {pedido.monto_total}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(pedido.fecha_creacion).toLocaleTimeString('es-PE', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">
                      {pago?.metodo_pago} • {pago?.estado}
                    </p>
                  </div>
                </div>
                
                {/* Items del pedido */}
                <div className="mt-3 space-y-2 bg-gray-50 p-3 rounded">
                  {detalles.map(detalle => (
                    <div key={detalle.id} className="flex justify-between items-center text-sm">
                      <div>
                        <span className="font-medium">
                          {detalle.cantidad}x {detalle.producto_nombre}
                        </span>
                        {detalle.notas && (
                          <span className="text-gray-500 text-xs block mt-1">🗒️ {detalle.notas}</span>
                        )}
                      </div>
                      <span className="text-gray-600 font-medium">
                        S/ {(detalle.precio_unitario * detalle.cantidad).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Botones de acción */}
                <div className="mt-3 flex gap-2 flex-wrap">
                  {pedido.estado === 'Pendiente' && (
                    <>
                      <button 
                        onClick={() => actualizarEstado(pedido.id, 'En preparacion')}
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded text-sm font-medium flex items-center gap-2"
                      >
                        🍳 Iniciar Preparación
                      </button>
                      <button 
                        onClick={() => actualizarEstado(pedido.id, 'Cancelado')}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-medium flex items-center gap-2"
                      >
                        ❌ Cancelar Pedido
                      </button>
                    </>
                  )}
                  
                  {pedido.estado === 'En preparacion' && (
                    <button 
                      onClick={() => actualizarEstado(pedido.id, 'Listo')}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded text-sm font-medium flex items-center gap-2"
                    >
                      ✅ Marcar como Listo
                    </button>
                  )}
                  
                  {pedido.estado === 'Listo' && (
                    <button 
                      onClick={() => actualizarEstado(pedido.id, 'Entregado')}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium flex items-center gap-2"
                    >
                      🚗 Marcar Entregado
                    </button>
                  )}

                  {pedido.estado === 'Entregado' && (
                    <span className="px-3 py-2 bg-gray-100 text-gray-600 rounded text-sm">
                      ✅ Pedido Completado
                    </span>
                  )}

                  {pedido.estado === 'Cancelado' && (
                    <span className="px-3 py-2 bg-red-100 text-red-600 rounded text-sm">
                      ❌ Pedido Cancelado
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Plataformas activas */}
      {estadisticas.pedidos_por_plataforma && Object.keys(estadisticas.pedidos_por_plataforma).length > 0 && (
        <div className="mt-6 bg-white p-4 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-3">📊 Distribución por Plataforma Hoy</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(estadisticas.pedidos_por_plataforma).map(([plataforma, data]) => (
              <div key={plataforma} className="text-center p-4 border-2 border-gray-100 rounded-lg hover:shadow-md transition-shadow">
                <p className="font-bold text-gray-700">{plataforma}</p>
                <p className="text-2xl font-bold text-blue-600 my-2">{data.cantidad}</p>
                <p className="text-sm text-gray-600">{data.cantidad === 1 ? 'pedido' : 'pedidos'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Pedidos_Aplicativo;