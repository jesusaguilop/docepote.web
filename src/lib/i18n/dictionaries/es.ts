/**
 * Textos de la tienda en español.
 *
 * Este archivo es la fuente de verdad: el diccionario portugués deriva su
 * forma de aquí (`type Dictionary = typeof es`), así que si se agrega una
 * clave y falta en portugués, TypeScript lo señala en compilación en vez de
 * dejar un hueco en pantalla.
 */

export const es = {
  nav: {
    catalogo: 'Catálogo',
    sabores: 'Sabores',
    nosotros: 'Nosotros',
    horario: 'Horario',
    carrito: 'Carrito',
    abrirMenu: 'Abrir menú',
    cerrarMenu: 'Cerrar menú',
    pedirWhatsApp: 'Pedir por WhatsApp',
    inicio: 'Inicio',
    idioma: 'Idioma',
  },

  hero: {
    kicker: 'Doceria artesanal · Valledupar',
    titulo: 'Un pedacito de Brasil en cada bocado.',
    lead: 'Capas de bizcocho y brigadeiro montadas a mano dentro de un potecito. Seis sabores, en versión individual, mini o kit para tus eventos.',
    verCatalogo: 'Ver catálogo',
    empaqueOriginal: 'Empaque original',
    mascotaAlt: 'El gato de Doce pote abrazando un pote de dulce',
  },

  facts: {
    sabores: 'sabores de la casa',
    hechoAMano: 'hecho a mano en Valledupar',
    contenido: 'de bizcocho y brigadeiro',
    kits: 'para eventos y celebraciones',
  },

  historia: {
    titulo: '¿Qué es un bolo no pote?',
    parrafo1:
      'Es la experiencia de llevar contigo, en un potecito, una deliciosa y típica sobremesa brasileña: una torta preparada con capas de bizcocho y brigadeiro, cuidadosamente montada dentro de un vasito para disfrutar cada cucharada.',
    parrafo2:
      'Cada pote se empaca a mano en bolsa de papel kraft, cerrada con nuestro sticker — pensada para que el postre viaje bien y se vea igual de bien cuando la abres. Es nuestra manera más rica de hacerte sentir un pedacito de Brasil aquí contigo, en Valledupar.',
    firma: '— Equipo DOCEPOTE',
    fotoAlt: 'Bolsa de papel kraft cerrada con el sticker del gato de Doce pote',
  },

  sabores: {
    eyebrow: 'Nuestros sabores',
    titulo: 'Seis recetas, una sola obsesión',
    lead: 'Cada pote se monta capa por capa: bizcocho, brigadeiro y el topping que le da carácter. Estos son los sabores que hacemos siempre.',
  },

  catalogo: {
    eyebrow: 'Todo lo que hay hoy',
    tituloPagina: 'El catálogo completo',
    leadPagina:
      'Preparamos en tandas cortas, así que el inventario cambia todos los días. Lo que ves aquí es lo que hay ahora mismo.',
    tituloPortada: 'El catálogo de hoy',
    leadPortada:
      'Individuales de 8 oz, minis para probar de todo y kits para eventos. Preparados en tandas pequeñas — cuando se acaban, se acaban.',
    todos: 'Todos',
    buscar: 'Buscar un sabor...',
    buscarAria: 'Buscar en el catálogo',
    filtrarAria: 'Filtrar por categoría',
    sinResultados: 'Nada por aquí todavía...',
    horneando: 'Estamos horneando... vuelve en un rato.',
  },

  producto: {
    agregar: 'Agregar',
    agregado: 'Agregado',
    agregarAria: 'Agregar {nombre} al carrito',
    agotado: 'Agotado por hoy',
    noDisponible: 'No disponible',
    seAcabo: 'se acabó por hoy',
    quedan: 'Quedan {n}',
    ultimas: 'Últimas {n} unidades',
    disponibles: '{n} disponibles hoy',
    porEncargo: 'Se prepara por encargo — coordinamos la fecha contigo.',
    unidades: '{n} unidades',
    cadaUno: 'c/u',
    sabor: 'Sabor',
    tamano: 'Tamaño',
    contiene: 'Contiene',
    potes: '{n} potes',
    queLleva: 'Qué lleva por dentro',
    precioPorPote: 'Sale a {precio} cada pote',
    teAhorras: 'Te ahorras {monto}',
    tambienTeGusta: 'También te puede gustar',
    empacado: 'Empacado a mano en bolsa kraft con nuestro sticker.',
    domicilio: 'Domicilio en Valledupar o recoges en el punto de entrega.',
    tandas: 'Hecho en tandas pequeñas, con receta brasileña propia.',
    agregadoToast: '{nombre} — agregado al carrito',
  },

  carrito: {
    titulo: 'Tu carrito',
    cerrar: 'Cerrar carrito',
    abrirAria: 'Abrir carrito, {n} {productos}',
    producto: 'producto',
    productos: 'productos',
    vacio: 'Aún vacío...',
    vacioLead: 'Agrega un pote a tu carrito y te lo dejamos listo.',
    verCatalogo: 'Ver el catálogo',
    quitar: 'Quitar',
    soloQuedan: 'Solo quedan {n}',
    subtotal: 'Subtotal',
    finalizar: 'Finalizar pedido',
    domicilioDespues: 'El domicilio se calcula en el siguiente paso.',
    faltanParaGratis: 'Te faltan {monto} para el domicilio gratis',
    retirados: 'Quitamos productos que ya no están disponibles.',
    quitarUnidad: 'Quitar una unidad',
    agregarUnidad: 'Agregar una unidad',
  },

  checkout: {
    eyebrow: 'Último paso',
    titulo: 'Finalizar pedido',
    comoRecibir: '¿Cómo lo quieres recibir?',
    recojo: 'Recojo en el punto',
    recojoHint: 'Sin costo adicional',
    domicilio: 'Domicilio',
    domicilioHint: 'Dentro de Valledupar',
    tusDatos: 'Tus datos',
    nombre: 'Nombre',
    nombrePlaceholder: 'Como te decimos',
    celular: 'Celular (WhatsApp)',
    direccion: 'Dirección de entrega',
    direccionPlaceholder: 'Calle 16 #12-30, barrio Novalito',
    notas: 'Notas',
    opcional: '(opcional)',
    notasPlaceholder: 'Dedicatoria, alergias, hora preferida...',
    tuPedido: 'Tu pedido',
    unidad: 'unidad',
    unidades: 'unidades',
    subtotal: 'Subtotal',
    total: 'Total',
    confirmar: 'Confirmar pedido',
    confirmando: 'Confirmando...',
    aviso: 'Al confirmar te abrimos WhatsApp con el resumen para cerrar el pago.',
    agregaMas: 'Agrega {monto} más y el domicilio va por nuestra cuenta.',
    vacio: 'Tu carrito está vacío',
    vacioLead: 'Elige algo del catálogo y vuelve — te lo guardamos aquí.',
    irCatalogo: 'Ir al catálogo',
    errorNombre: 'Cuéntanos tu nombre.',
    errorCelular: 'Necesitamos un celular de 10 dígitos.',
    errorDireccion: 'Escribe la dirección completa, con barrio.',
  },

  pedido: {
    gracias: '¡Gracias!',
    tuPedido: 'Tu pedido',
    numero: 'Pedido {codigo}',
    recibido: 'Ya nos llegó, {nombre}. Te confirmamos por WhatsApp en un momento.',
    estadoActual: 'Estado actual: {estado}.',
    loQuePediste: 'Lo que pediste',
    subtotal: 'Subtotal',
    total: 'Total',
    datosEntrega: 'Datos de entrega',
    notas: 'Notas',
    guardaEnlace: 'Guarda este enlace para seguir tu pedido cuando quieras.',
    seguirComprando: 'Seguir comprando',
    escribirWhatsApp: 'Escribir por WhatsApp',
    consultaWhatsApp: 'Hola, pregunto por mi pedido {codigo}',
    cancelado: 'Pedido cancelado',
    canceladoLead: 'Si crees que fue un error, escríbenos por WhatsApp y lo revisamos.',
    pasoDe: 'Estado actual del pedido: {estado}. Paso {actual} de {total}.',
    pasos: {
      recibido: 'Recibido',
      recibidoHint: 'Ya nos llegó tu pedido',
      confirmado: 'Confirmado',
      confirmadoHint: 'Lo confirmamos contigo',
      preparacion: 'En preparación',
      preparacionHint: 'Manos a la obra',
      listo: 'Listo',
      listoHint: 'Listo para salir',
      entregado: 'Entregado',
      entregadoHint: '¡Que lo disfrutes!',
    },
  },

  horario: {
    titulo: 'Nuestro horario',
    lead: 'Puedes pasar por tu pedido en el punto de entrega o coordinar domicilio dentro de estos horarios.',
    hacerPedido: 'Hacer un pedido',
    escribenos: 'Escríbenos',
    lunesViernes: 'Lunes a viernes',
    sabados: 'Sábados',
    domingos: 'Domingos',
  },

  frase: {
    cita: '"Un potecito de cariño a la vez."',
    sub: 'Sin fórmulas raras — solo buenos ingredientes y tiempo.',
  },

  footer: {
    descripcion:
      'Un pedacito de Brasil en cada bocado — bolo no pote artesanal, capas de bizcocho y brigadeiro montadas a mano en Valledupar. Kits para eventos y fechas especiales.',
    explorar: 'Explorar',
    contacto: 'Contacto',
    ubicacion: 'Valledupar, Colombia',
    lema: 'Un potecito de cariño a la vez',
    hechoPor: 'Hecho por',
  },

  noEncontrado: {
    uy: 'Uy...',
    titulo: 'Este pote no existe',
    lead: 'La página que buscas se acabó o nunca estuvo en el mostrador. Vuelve al catálogo, que ahí siempre hay algo recién hecho.',
    verCatalogo: 'Ver el catálogo',
    irInicio: 'Ir al inicio',
  },

  categorias: {
    individual: 'Bolo no pote individual',
    mini: 'Mini bolo no pote',
    combo: 'Para compartir',
    eventos: 'Eventos',
    individualCorto: 'Individual',
    miniCorto: 'Mini',
    comboCorto: 'Combos',
    eventosCorto: 'Eventos',
  },

  entrega: {
    pickup: 'Recoger en el punto',
    delivery: 'Domicilio en Valledupar',
    gratis: 'Gratis',
    sinCosto: 'Sin costo',
  },
} as const;
