// ============================================================
//  Términos y condiciones + Política de privacidad.
//
//  Base: russitex-terminos.html y russitex-privacidad.html (version1 de
//  almacen-russitex), actualizadas a lo que la tienda usa de verdad
//  (octubre de 2026): Wompi, Envia.com, Alegra, Supabase, Render,
//  Cloudflare, Zoho, OpenAI (asistente Rusti), WhatsApp Business.
//  Si se agrega o quita un servicio que reciba datos de clientes,
//  actualizar la sección "Con quién compartimos tus datos".
//
//  Mismo formato que legales.js: párrafos en HTML corto. {{whatsapp}} y
//  {{correo}} salen de tienda_info. Los enlaces que empiezan por "/" navegan
//  dentro de la web.
// ============================================================
const VENDEDOR =
  'Hilda Porras López, persona natural comerciante que opera con el nombre comercial <strong>Almacén Russitex P.L.</strong>, ' +
  'identificada con NIT 51.567.061-9, con establecimiento de comercio en la Calle 66 # 21-50, Bogotá D.C., Colombia, ' +
  'correo electrónico {{correo}} y WhatsApp {{whatsapp}}'

export const TERMINOS_PRIVACIDAD = {
  terminos: {
    ruta: '/terminos-y-condiciones',
    migas: 'Términos y condiciones',
    eyebrow: 'Reglas claras',
    titulo: ['Términos y ', 'condiciones'],
    sub: 'Las condiciones para usar nuestra tienda en línea y comprar en ella.',
    intro:
      'Los presentes Términos y Condiciones regulan el acceso y uso del sitio web de Almacén Russitex P.L. (russitex.com) y la compra de productos a través de él, ' +
      'de conformidad con la Ley 527 de 1999 (comercio electrónico) y la Ley 1480 de 2011 (Estatuto del Consumidor). Al realizar una compra, el usuario declara que los ha leído y los acepta. ' +
      'Si no está de acuerdo con alguna de estas condiciones, deberá abstenerse de comprar a través del sitio web.',
    secciones: [
      {
        titulo: 'Identificación del vendedor',
        parrafos: [`La tienda en línea es operada por ${VENDEDOR}, quien es responsable de las ventas realizadas a través de ella.`],
      },
      {
        titulo: 'Productos, precios y disponibilidad',
        parrafos: [
          'Los productos ofrecidos son materiales e insumos para confección, como forros, entretelas, hombreras, guatas, tizas, cremalleras y demás insumos de sastrería. ' +
          'Las imágenes son ilustrativas y los colores pueden verse distintos según la pantalla de cada dispositivo.',
          'Los precios se expresan en pesos colombianos (COP) y son el valor final a pagar por cada producto. Almacén Russitex P.L. no es responsable del impuesto sobre las ventas (IVA), ' +
          'por lo que este no se cobra ni se discrimina. El costo del envío se informa por separado antes de pagar. ' +
          'Los precios pueden cambiar en cualquier momento; el precio que se cobra es el que se muestra al confirmar la compra.',
          'La disponibilidad de los productos se actualiza de forma manual. Si después de pagar un producto resulta agotado, Almacén Russitex P.L. se comunicará con el cliente ' +
          'para ofrecerle un producto similar o la devolución del dinero correspondiente, a su elección.',
        ],
      },
      {
        titulo: 'Proceso de compra',
        parrafos: [
          'Para comprar, el usuario agrega los productos al carrito, diligencia sus datos y la forma de entrega, y paga a través de la pasarela de pagos. ' +
          'La compra queda confirmada cuando el pago es aprobado; en ese momento el cliente recibe un correo electrónico con el resumen del pedido.',
          'Almacén Russitex P.L. podrá cancelar un pedido en caso de error evidente en el precio publicado, falta de inventario o indicios de fraude, informándolo al cliente ' +
          'y reembolsando la totalidad de lo pagado.',
        ],
      },
      {
        titulo: 'Medios de pago',
        parrafos: [
          'Los pagos en línea se procesan a través de Wompi, que acepta tarjetas de crédito y débito, PSE, Nequi, Daviplata y otros medios disponibles en su plataforma. ' +
          'Almacén Russitex P.L. no recibe ni almacena datos de tarjetas ni claves bancarias: esa información la gestiona directamente Wompi bajo sus propios estándares de seguridad. ' +
          'En la tienda física se aceptan además pagos en efectivo.',
        ],
      },
      {
        titulo: 'Facturación electrónica',
        parrafos: [
          'Por cada compra se expide factura electrónica de venta, que se envía a la DIAN y al correo del cliente a través de Alegra, nuestro proveedor de facturación electrónica. ' +
          'La factura se emite a nombre de la persona natural o de la empresa (razón social y NIT) según los datos que el cliente indique al comprar. ' +
          'Es responsabilidad del cliente suministrar datos de facturación correctos y completos.',
        ],
      },
      {
        titulo: 'Envíos y recogida en tienda',
        parrafos: [
          'Las condiciones de cobertura, tiempos de entrega y costos de envío se describen en la <a href="/politica-de-envios">Política de envíos</a>. ' +
          'El cliente también puede elegir recoger su pedido sin costo en la tienda física, en el horario de atención; le avisaremos cuando esté listo.',
        ],
      },
      {
        titulo: 'Cambios, devoluciones y derecho de retracto',
        parrafos: [
          'Las condiciones de garantía, cambios, devoluciones y derecho de retracto se describen en la <a href="/cambios-y-devoluciones">Política de cambios y devoluciones</a>.',
        ],
      },
      {
        titulo: 'Reversión del pago',
        parrafos: [
          'De acuerdo con el artículo 51 de la Ley 1480 de 2011 y el Decreto 1074 de 2015, cuando el pago se haya hecho con tarjeta de crédito, débito u otro instrumento de pago electrónico, ' +
          'el cliente podrá solicitar la reversión del pago si fue objeto de fraude, si se trata de una operación no solicitada, si el producto no fue recibido, ' +
          'o si el producto entregado no corresponde a lo solicitado o es defectuoso.',
          'Para ello deberá presentar la queja ante Almacén Russitex P.L. por los canales indicados en estos términos y avisar de la reclamación al emisor del instrumento de pago (su banco o entidad), ' +
          'dentro de los cinco (5) días hábiles siguientes a la fecha en que tuvo noticia de la operación fraudulenta o no solicitada, o en que debió recibir el producto o lo recibió defectuoso o diferente. ' +
          'Cuando proceda, el cliente deberá devolver el producto en las mismas condiciones en que lo recibió.',
        ],
      },
      {
        titulo: 'Cuentas de usuario',
        parrafos: [
          'El usuario puede comprar sin crear una cuenta, o crear una con su correo electrónico o con Google o Facebook. Con la cuenta puede consultar sus pedidos, ' +
          'guardar direcciones y datos de facturación, y encontrar el formulario de compra ya diligenciado.',
          'El usuario es responsable de la confidencialidad de su contraseña y de la actividad realizada desde su cuenta, y deberá avisarnos de inmediato si detecta un uso no autorizado.',
        ],
      },
      {
        titulo: 'Asistente virtual',
        parrafos: [
          'El sitio cuenta con un asistente virtual (Rusti) que responde preguntas sobre productos y materiales con ayuda de inteligencia artificial. ' +
          'Sus respuestas son orientativas y pueden contener errores; los precios, la disponibilidad y las condiciones que aplican son los que se muestran en el carrito y al confirmar la compra. ' +
          'Para una asesoría personalizada, el cliente puede escribirnos por WhatsApp o visitarnos en la tienda.',
        ],
      },
      {
        titulo: 'Comunicaciones por WhatsApp y correo',
        parrafos: [
          'Almacén Russitex P.L. utiliza el correo electrónico y WhatsApp Business para atender consultas y enviar información sobre los pedidos (confirmación, envío, entrega o novedades). ' +
          'Los mensajes promocionales solo se enviarán a quienes lo hayan autorizado expresamente, y el cliente podrá dejar de recibirlos en cualquier momento.',
        ],
      },
      {
        titulo: 'Propiedad intelectual',
        parrafos: [
          'Los contenidos del sitio web, como textos, imágenes, logotipos y diseño, son propiedad de Almacén Russitex P.L. o de sus respectivos titulares y están protegidos por las normas ' +
          'de propiedad intelectual. No se permite su reproducción o uso comercial sin autorización previa y escrita.',
        ],
      },
      {
        titulo: 'Responsabilidad',
        parrafos: [
          'Almacén Russitex P.L. procura que el sitio web funcione de forma continua y segura, pero no garantiza que esté libre de interrupciones o errores técnicos. ' +
          'Lo anterior no limita la garantía legal de los productos ni los demás derechos que la ley reconoce al consumidor.',
        ],
      },
      {
        titulo: 'Datos personales',
        parrafos: [
          'El tratamiento de los datos personales se rige por la <a href="/politica-de-privacidad">Política de privacidad</a>, en cumplimiento de la Ley 1581 de 2012.',
        ],
      },
      {
        titulo: 'Menores de edad',
        parrafos: [
          'Las compras realizadas por menores de edad deben contar con la autorización y el acompañamiento de sus padres o representantes legales, quienes responderán por ellas.',
        ],
      },
      {
        titulo: 'Ley aplicable',
        parrafos: [
          'Estos términos se rigen por las leyes de la República de Colombia. Las controversias se resolverán ante las autoridades competentes, sin perjuicio del derecho del consumidor ' +
          'a acudir a la Superintendencia de Industria y Comercio.',
        ],
      },
      {
        titulo: 'Vigencia y modificaciones',
        parrafos: [
          'Estos Términos y Condiciones rigen a partir de noviembre de 2026. Almacén Russitex P.L. podrá modificarlos en cualquier momento; los cambios se publicarán en este sitio web ' +
          'y aplicarán a las compras realizadas después de su publicación.',
        ],
      },
    ],
  },

  privacidad: {
    ruta: '/politica-de-privacidad',
    migas: 'Política de privacidad',
    eyebrow: 'Tus datos, protegidos',
    titulo: ['Política de ', 'privacidad'],
    sub: 'Qué datos recogemos, para qué los usamos, con quién los compartimos y cómo ejercer tus derechos.',
    intro:
      'En cumplimiento de la Ley 1581 de 2012, el Decreto 1377 de 2013 (compilado en el Decreto 1074 de 2015) y el artículo 15 de la Constitución Política de Colombia, ' +
      'Almacén Russitex P.L. adopta la presente Política para el tratamiento de los datos personales de quienes usan nuestro sitio web y nuestros servicios, ' +
      'con el fin de garantizar el derecho al habeas data y el uso adecuado, seguro y transparente de su información.',
    secciones: [
      {
        titulo: 'Responsable del tratamiento',
        parrafos: [`El responsable del tratamiento de los datos personales es ${VENDEDOR}.`],
      },
      {
        titulo: 'Qué datos recogemos',
        parrafos: [
          '<strong>Al comprar o crear una cuenta:</strong> nombres y apellidos, tipo y número de documento, celular, correo electrónico y direcciones de entrega. ' +
          'Si compras como empresa, también la razón social, el NIT, la responsabilidad de IVA y el celular y correo de la empresa. Si entras con Google o Facebook, recibimos tu nombre y correo de esa cuenta.',
          '<strong>Sobre tus compras:</strong> los productos, valores, forma de entrega, estado del pago y del envío, y la factura de cada pedido. ' +
          'No recibimos ni guardamos datos de tarjetas ni claves bancarias.',
          '<strong>Cuando nos escribes:</strong> lo que envías en el formulario de asesoría (incluida la foto, si adjuntas una), tu correo si pides que te avisemos cuando un producto vuelva a estar disponible, ' +
          'tus conversaciones con el asistente virtual y los mensajes que nos envíes por WhatsApp o correo.',
          '<strong>Datos técnicos:</strong> la dirección IP y los registros técnicos del servidor, que usamos por seguridad, para prevenir abusos y para limitar el uso del asistente virtual.',
        ],
      },
      {
        titulo: 'Para qué usamos tus datos',
        parrafos: [
          'Usamos tus datos para: procesar tus pedidos y pagos; generar y entregar las guías de envío; expedir la factura electrónica ante la DIAN; ' +
          'comunicarnos contigo por correo o WhatsApp sobre tu pedido, tu envío o tus consultas; administrar tu cuenta y llenar por ti el formulario de compra con tus datos guardados; ' +
          'avisarte cuando un producto vuelva a estar disponible, si lo pediste; responder tus solicitudes de asesoría; mejorar la tienda y el asistente virtual; ' +
          'prevenir fraudes; y cumplir nuestras obligaciones legales, contables y tributarias.',
          'Solo te enviaremos promociones o novedades por correo o WhatsApp si nos das tu autorización expresa para ello, y podrás retirarla en cualquier momento. ' +
          'No vendemos tus datos ni los cedemos a terceros para fines comerciales ajenos a la tienda.',
        ],
      },
      {
        titulo: 'Con quién compartimos tus datos',
        parrafos: [
          'Para prestar el servicio, compartimos los datos estrictamente necesarios con proveedores que los tratan por cuenta nuestra (encargados del tratamiento):',
          '<strong>Wompi</strong> (Bancolombia), para procesar los pagos. ' +
          '<strong>Envia.com</strong> y las transportadoras que realizan la entrega, para generar la guía y entregar el pedido. ' +
          '<strong>Alegra</strong>, nuestro proveedor de facturación electrónica, que transmite las facturas a la <strong>DIAN</strong>. ' +
          '<strong>Supabase</strong>, donde se almacenan las cuentas, los pedidos y las direcciones. ' +
          '<strong>Render</strong> y <strong>Cloudflare</strong>, que alojan el sitio web y su servidor. ' +
          '<strong>Zoho</strong>, que envía nuestros correos. ' +
          '<strong>OpenAI</strong>, que procesa los mensajes que escribes al asistente virtual para generar sus respuestas. ' +
          '<strong>Meta (WhatsApp Business)</strong>, por donde nos comunicamos contigo por WhatsApp. ' +
          '<strong>Google</strong> y <strong>Facebook</strong>, solo si eliges iniciar sesión con ellos.',
          'También entregaremos datos a autoridades cuando una norma o una orden lo exija. Recomendamos no escribir datos sensibles, como información de salud o bancaria, en el asistente virtual ni en los formularios.',
        ],
      },
      {
        titulo: 'Transferencia internacional de datos',
        parrafos: [
          'Varios de estos proveedores almacenan o procesan la información en servidores ubicados fuera de Colombia, principalmente en los Estados Unidos. ' +
          'Al aceptar esta política autorizas esa transferencia o transmisión internacional, que se realiza con proveedores que cuentan con medidas de seguridad y políticas de protección de datos propias, ' +
          'y únicamente para las finalidades descritas aquí.',
        ],
      },
      {
        titulo: 'Autorización',
        parrafos: [
          'Pedimos tu autorización previa, expresa e informada antes de tratar tus datos: al crear una cuenta, al marcar la casilla de aceptación en el proceso de compra ' +
          'y al enviar nuestros formularios. Puedes revocarla en cualquier momento por los canales indicados más adelante, salvo cuando exista un deber legal o contractual de conservar la información.',
        ],
      },
      {
        titulo: 'Almacenamiento en tu navegador y cookies',
        parrafos: [
          'Para que la tienda funcione guardamos información en tu propio navegador: el contenido de tu carrito, tu sesión iniciada y, si compras sin cuenta, los datos de tu última compra, ' +
          'para no tener que escribirlos de nuevo. Puedes borrarlos con la opción "¿No eres tú? Borrar estos datos" del formulario de compra, al cerrar sesión o desde la configuración de tu navegador. ' +
          'Te recomendamos no usar esta opción en computadores compartidos.',
          'Hoy no usamos cookies de publicidad ni herramientas de analítica. Nuestro proveedor de alojamiento puede usar cookies técnicas de seguridad. ' +
          'Si en el futuro incorporamos herramientas de medición, lo informaremos en esta política.',
        ],
      },
      {
        titulo: 'Datos de menores de edad',
        parrafos: [
          'Los datos de niños, niñas y adolescentes solo se tratarán con la autorización de sus padres o representantes legales, respetando su interés superior y sus derechos fundamentales, ' +
          'conforme al artículo 7 de la Ley 1581 de 2012.',
        ],
      },
      {
        titulo: 'Seguridad de la información',
        parrafos: [
          'Adoptamos medidas técnicas y administrativas razonables para proteger tus datos contra el acceso no autorizado, la pérdida o la alteración: el sitio funciona con conexión cifrada (HTTPS), ' +
          'el acceso a la información está restringido y las contraseñas se almacenan cifradas por nuestro proveedor de autenticación. ' +
          'Si se presenta un incidente que comprometa tus datos, te lo informaremos oportunamente, así como a las autoridades competentes.',
        ],
      },
      {
        titulo: 'Conservación de los datos',
        parrafos: [
          'Conservamos tus datos mientras tengas una cuenta activa o mientras sean necesarios para las finalidades descritas. ' +
          'La información de pedidos y facturas se conserva durante el tiempo que exigen las normas contables y tributarias.',
        ],
      },
      {
        titulo: 'Tus derechos',
        parrafos: [
          'Como titular de los datos tienes derecho a: conocer, actualizar y rectificar tus datos personales; solicitar prueba de la autorización otorgada; ' +
          'ser informado sobre el uso que se les ha dado; presentar quejas ante la Superintendencia de Industria y Comercio; revocar la autorización o pedir la supresión de tus datos ' +
          'cuando no exista un deber legal o contractual que lo impida; y acceder gratuitamente a ellos. Buena parte de tus datos puedes verlos y corregirlos tú mismo en <a href="/mi-cuenta/detalles">Mi cuenta</a>.',
        ],
      },
      {
        titulo: 'Cómo ejercer tus derechos',
        parrafos: [
          'Escríbenos al correo {{correo}} o por WhatsApp al {{whatsapp}}, indicando tu nombre completo, tu número de documento y una descripción clara de tu solicitud.',
          'Las consultas se atenderán en un plazo máximo de diez (10) días hábiles y los reclamos en un plazo máximo de quince (15) días hábiles, contados desde su recibo. ' +
          'Si no es posible atenderlos en ese término, te informaremos el motivo y la nueva fecha de respuesta, conforme a los artículos 14 y 15 de la Ley 1581 de 2012.',
        ],
      },
      {
        titulo: 'Vigencia',
        parrafos: [
          'Esta Política para el Tratamiento de Datos Personales rige a partir de noviembre de 2026. Podemos modificarla en cualquier momento; ' +
          'los cambios importantes se informarán en este sitio web antes de aplicarse.',
        ],
      },
    ],
  },
}
