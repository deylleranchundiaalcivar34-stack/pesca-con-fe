// Contenido editable de la página pública; no depende de la base de datos.
export const frequentlyAskedQuestions = [
  {
    question: "¿Necesito una cuenta para comprar?",
    answer:
      "Puedes explorar el catálogo y preparar tu carrito sin iniciar sesión. Para generar el pedido sí necesitas una cuenta, porque usamos tu perfil para identificar la compra y mostrarla en Mis pedidos.",
  },
  {
    id: "promocion-bienvenida",
    question: "¿Cómo funciona el descuento de bienvenida del 10%?",
    answer:
      "Es un beneficio automático para clientes nuevos en su primera compra elegible. Estas son sus condiciones:",
    details: [
      "Vigencia: del 22 de agosto al 31 de diciembre de 2026.",
      "La compra debe alcanzar un subtotal mínimo de $50 en productos.",
      "El descuento equivale al 10% del subtotal elegible, con un máximo de $10.",
      "Puede utilizarse una sola vez por cliente y requiere una cuenta sin compras anteriores confirmadas.",
      "No se combina con precios de oferta, cupones ni otras promociones.",
      "Se aplica únicamente a los productos; no cubre envío ni recargos del método de pago.",
      "Si el pedido se cancela antes de confirmar el pago, la reserva se libera para intentarlo de nuevo mientras la promoción siga vigente.",
      "En una devolución se considera el valor efectivamente pagado; el descuento no se entrega ni se convierte en dinero.",
      "Los pedidos y productos continúan sujetos a disponibilidad y validación de las condiciones.",
    ],
  },
  {
    question: "¿Cómo genero un pedido?",
    answer:
      "Agrega los productos al carrito, revisa sus cantidades y continúa a la pantalla para generar el pedido. Después de elegir entrega y cuenta bancaria, se creará el pedido y se abrirá WhatsApp para que envíes el comprobante de transferencia.",
  },
  {
    question: "¿Qué formas de pago aceptan?",
    answer:
      "Los pedidos de la web se pagan mediante transferencia bancaria. En el formulario para generar el pedido podrás elegir una de las cuentas disponibles y luego enviar el comprobante por WhatsApp para que el negocio confirme el pago.",
  },
  {
    question: "¿Realizan envíos?",
    answer:
      "Sí. Realizamos envíos por Servientrega a ciudades de Ecuador. El costo correspondiente se muestra en el resumen antes de generar el pedido.",
  },
  {
    question: "¿Puedo retirar mi compra en el local?",
    answer:
      "Sí. El retiro en el local no tiene costo de envío. Espera la confirmación por WhatsApp antes de acercarte al Mega Mercado Municipal, Local N.º 145, Planta Alta, en Shushufindi.",
  },
  {
    question: "¿Puedo usar una dirección diferente para un pedido?",
    answer:
      "Sí. Al generar el pedido puedes elegir una dirección guardada o ingresar una dirección temporal que se usará solamente para esa compra.",
  },
  {
    question: "¿Cómo sé si un producto está disponible?",
    answer:
      "Cada producto muestra su disponibilidad actual en el catálogo. Si necesitas confirmar una cantidad o consultar por un artículo agotado, puedes escribirnos por WhatsApp.",
  },
  {
    question: "¿Dónde puedo revisar mis pedidos?",
    answer:
      "Después de iniciar sesión, abre el menú de tu cuenta y entra en Mis pedidos. Allí verás tus compras y su estado actual.",
  },
] as const;
