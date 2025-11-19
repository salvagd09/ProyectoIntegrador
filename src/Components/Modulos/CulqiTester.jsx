import React, { useEffect, useState } from "react";
export default function CulqiTester({ 
  total, 
  pedidoId,
  email,
  onPaymentSuccess,
  onPaymentError 
}) {
  const [loading, setLoading] = useState(false);
  const [culqiLoaded, setCulqiLoaded] = useState(false);
  useEffect(() => {
    // Cargar el script de Culqi solo una vez
    const existingScript = document.getElementById("culqi-script");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "culqi-script";
      script.src = "https://checkout.culqi.com/js/v4";
      script.async = true;
      script.onload = () => {
        console.log("✅ Culqi cargado correctamente");
        setCulqiLoaded(true);
      };
      script.onerror = () => {
        console.error("❌ Error al cargar Culqi");
        if (onPaymentError) {
          onPaymentError("No se pudo cargar el sistema de pagos");
        }
      };
      document.body.appendChild(script);
    } else {
      setCulqiLoaded(true);
    }
    // Callback global de Culqi (token u orden)
    window.culqi = async function () {
      // Manejar errores de Culqi
      if (window.Culqi.error) {
        const errorMsg = window.Culqi.error.user_message || "Error al procesar el pago";
        console.error("❌ Error Culqi:", window.Culqi.error);
        setLoading(false);
        if (onPaymentError) {
          onPaymentError(errorMsg);
        }
        return;
      }
      // Manejar token exitoso
      if (window.Culqi.token) {
        const token = window.Culqi.token.id;
        console.log("💳 Token recibido:", token);
        setLoading(true);
        try {
          // Enviar token al backend para procesar el pago
          const response = await fetch("http://127.0.0.1:8000/api/pagos/procesar-tarjeta", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              pedido_id: pedidoId,
              token_culqi: token,
              email: email
            }),
          });
          const data = await response.json();
          if (response.ok && data.success) {
            console.log("✅ Pago procesado exitosamente:", data);
            if (onPaymentSuccess) {
              onPaymentSuccess({
                cargo_id: data.cargo_id,
                monto: data.monto,
                pedido_id: data.pedido_id
              });
            }
          } else {
            console.error("❌ Error en el pago:", data);
            if (onPaymentError) {
              onPaymentError(data.detail || data.mensaje || "Error al procesar el pago");
            }
          }
        } catch (error) {
          console.error("❌ Error de red:", error);
          if (onPaymentError) {
            onPaymentError("Error de conexión con el servidor");
          }
        } finally {
          setLoading(false);
        }
      } 
      // Manejar orden (si usas órdenes de pago)
      else if (window.Culqi.order) {
        console.log("🧾 Orden generada:", window.Culqi.order);
        const orderId = window.Culqi.order.id;
        console.log("Order ID:", orderId);
        // Aquí podrías manejar la lógica de órdenes si la implementas
      } 
      else {
        console.warn("⚠️ No se generó un token ni orden Culqi.");
        if (onPaymentError) {
          onPaymentError("No se pudo generar el pago");
        }
      }
    };
  }, []); // ✅ Sin dependencias - solo se ejecuta una vez

  // Abre el modal de Culqi
  const abrirCulqi = () => {
    if (!window.Culqi) {
      alert("⚠️ Culqi aún no se ha cargado completamente. Espera un momento.");
      return;
    }

    if (!email || !pedidoId) {
      alert("⚠️ Faltan datos necesarios para procesar el pago");
      return;
    }

    // Configura tu clave pública de prueba
    window.Culqi.publicKey = "pk_test_vzMuTHoueOMlbUbG";

    // Configuración del modal Culqi
    window.Culqi.settings({
      title: "Restaurante GestaFood",
      currency: "PEN",
      description: "Pago de pedido (Tarjeta / Yape / Plin)",
      amount: Math.round(total * 100), // en céntimos
      options: {
        tarjeta: true,
        yape: true,
        plin: true,
      },
      style: {
        logo: "https://seeklogo.com/images/C/ceviche-logo-D94F9F66E1-seeklogo.com.png",
        maincolor: "#212529",
        buttontext: "#ffffff",
        maintext: "#000000",
        desctext: "#000000",
      },
    });

    window.Culqi.open();
  };

  return (
    <div className="d-flex flex-column align-items-center">
      <h5 className="fw-bold text-dark mb-2">💳 Pago con Culqi</h5>
      <p className="text-muted mb-3">
        Puedes usar <b>Tarjeta</b>, <b>Yape</b> o <b>Plin</b> desde el modal.
      </p>

      <button
        onClick={abrirCulqi}
        className="btn btn-dark rounded-3 w-100"
        style={{ maxWidth: "300px" }}
        disabled={loading || !culqiLoaded}
      >
        {loading ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Procesando pago...
          </>
        ) : !culqiLoaded ? (
          "Cargando..."
        ) : (
          "💰 Pagar con Culqi"
        )}
      </button>

      {loading && (
        <div className="alert alert-info mt-3 text-center">
          <small>⏳ Procesando tu pago, por favor espera...</small>
        </div>
      )}
    </div>
  );
}
