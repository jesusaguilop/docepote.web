/**
 * Textos da loja em português.
 *
 * A forma vem de `es`: se uma chave for adicionada lá e faltar aqui, o
 * TypeScript acusa na compilação em vez de deixar um buraco na tela.
 *
 * Nomes como "bolo no pote", "brigadeiro" ou "pão de ló" ficam iguais nos
 * dois idiomas — já são português, é a origem da marca.
 */

import type { Dictionary } from '../index';

export const pt: Dictionary = {
  nav: {
    catalogo: 'Cardápio',
    sabores: 'Sabores',
    nosotros: 'Sobre nós',
    horario: 'Horário',
    carrito: 'Carrinho',
    abrirMenu: 'Abrir menu',
    cerrarMenu: 'Fechar menu',
    pedirWhatsApp: 'Pedir pelo WhatsApp',
    inicio: 'Início',
    idioma: 'Idioma',
  },

  hero: {
    kicker: 'Doceria artesanal · Valledupar',
    titulo: 'Um pedacinho do Brasil em cada colherada.',
    lead: 'Camadas de pão de ló e brigadeiro montadas à mão dentro de um potinho. Seis sabores, na versão individual, mini ou kit para os seus eventos.',
    verCatalogo: 'Ver cardápio',
    empaqueOriginal: 'Embalagem original',
    mascotaAlt: 'O gato da Doce pote abraçando um pote de doce',
  },

  facts: {
    sabores: 'sabores da casa',
    hechoAMano: 'feito à mão em Valledupar',
    contenido: 'de pão de ló e brigadeiro',
    kits: 'para eventos e comemorações',
  },

  historia: {
    titulo: 'O que é um bolo no pote?',
    parrafo1:
      'É a experiência de levar com você, num potinho, uma deliciosa e típica sobremesa brasileira: um bolo feito com camadas de pão de ló e brigadeiro, montado com cuidado dentro de um copinho para aproveitar cada colherada.',
    parrafo2:
      'Cada pote é embalado à mão em saquinho de papel kraft, fechado com o nosso adesivo — pensado para que a sobremesa viaje bem e continue bonita quando você abrir. É o nosso jeito mais gostoso de trazer um pedacinho do Brasil até aqui, em Valledupar.',
    firma: '— Equipe DOCEPOTE',
    fotoAlt: 'Saquinho de papel kraft fechado com o adesivo do gato da Doce pote',
  },

  sabores: {
    eyebrow: 'Nossos sabores',
    titulo: 'Seis receitas, uma só obsessão',
    lead: 'Cada pote é montado camada por camada: pão de ló, brigadeiro e a cobertura que dá o toque final. Estes são os sabores que fazemos sempre.',
  },

  catalogo: {
    eyebrow: 'Tudo o que tem hoje',
    tituloPagina: 'O cardápio completo',
    leadPagina:
      'Fazemos em fornadas pequenas, então o estoque muda todos os dias. O que você vê aqui é o que tem agora.',
    tituloPortada: 'O cardápio de hoje',
    leadPortada:
      'Individuais de 8 oz, minis para provar de tudo e kits para eventos. Feitos em fornadas pequenas — quando acaba, acabou.',
    todos: 'Todos',
    buscar: 'Buscar um sabor...',
    buscarAria: 'Buscar no cardápio',
    filtrarAria: 'Filtrar por categoria',
    sinResultados: 'Nada por aqui ainda...',
    horneando: 'Estamos assando... volte daqui a pouco.',
  },

  producto: {
    agregar: 'Adicionar',
    agregado: 'Adicionado',
    agregarAria: 'Adicionar {nombre} ao carrinho',
    agotado: 'Esgotado por hoje',
    noDisponible: 'Indisponível',
    seAcabo: 'acabou por hoje',
    quedan: 'Restam {n}',
    ultimas: 'Últimas {n} unidades',
    disponibles: '{n} disponíveis hoje',
    porEncargo: 'Feito sob encomenda — combinamos a data com você.',
    unidades: '{n} unidades',
    cadaUno: 'cada',
    sabor: 'Sabor',
    tamano: 'Tamanho',
    contiene: 'Contém',
    potes: '{n} potes',
    queLleva: 'O que vai dentro',
    precioPorPote: 'Sai a {precio} cada pote',
    teAhorras: 'Você economiza {monto}',
    tambienTeGusta: 'Você também pode gostar',
    empacado: 'Embalado à mão em saquinho kraft com o nosso adesivo.',
    domicilio: 'Entrega em Valledupar ou retirada no ponto combinado.',
    tandas: 'Feito em fornadas pequenas, com receita brasileira própria.',
    agregadoToast: '{nombre} — adicionado ao carrinho',
  },

  carrito: {
    titulo: 'Seu carrinho',
    cerrar: 'Fechar carrinho',
    abrirAria: 'Abrir carrinho, {n} {productos}',
    producto: 'produto',
    productos: 'produtos',
    vacio: 'Ainda vazio...',
    vacioLead: 'Adicione um pote ao carrinho e deixamos tudo pronto.',
    verCatalogo: 'Ver o cardápio',
    quitar: 'Remover',
    soloQuedan: 'Restam apenas {n}',
    subtotal: 'Subtotal',
    finalizar: 'Finalizar pedido',
    domicilioDespues: 'A entrega é calculada no próximo passo.',
    faltanParaGratis: 'Faltam {monto} para a entrega grátis',
    retirados: 'Removemos produtos que não estão mais disponíveis.',
    quitarUnidad: 'Remover uma unidade',
    agregarUnidad: 'Adicionar uma unidade',
  },

  checkout: {
    eyebrow: 'Último passo',
    titulo: 'Finalizar pedido',
    comoRecibir: 'Como você quer receber?',
    recojo: 'Retirar no ponto',
    recojoHint: 'Sem custo adicional',
    domicilio: 'Entrega',
    domicilioHint: 'Dentro de Valledupar',
    tusDatos: 'Seus dados',
    nombre: 'Nome',
    nombrePlaceholder: 'Como te chamamos',
    celular: 'Celular (WhatsApp)',
    direccion: 'Endereço de entrega',
    direccionPlaceholder: 'Calle 16 #12-30, bairro Novalito',
    notas: 'Observações',
    opcional: '(opcional)',
    notasPlaceholder: 'Dedicatória, alergias, horário preferido...',
    tuPedido: 'Seu pedido',
    unidad: 'unidade',
    unidades: 'unidades',
    subtotal: 'Subtotal',
    total: 'Total',
    confirmar: 'Confirmar pedido',
    confirmando: 'Confirmando...',
    aviso: 'Ao confirmar, abrimos o WhatsApp com o resumo para fechar o pagamento.',
    agregaMas: 'Adicione mais {monto} e a entrega fica por nossa conta.',
    vacio: 'Seu carrinho está vazio',
    vacioLead: 'Escolha algo no cardápio e volte — guardamos aqui para você.',
    irCatalogo: 'Ir ao cardápio',
    errorNombre: 'Conte para nós o seu nome.',
    errorCelular: 'Precisamos de um celular com 10 dígitos.',
    errorDireccion: 'Escreva o endereço completo, com o bairro.',
  },

  pedido: {
    gracias: 'Obrigado!',
    tuPedido: 'Seu pedido',
    numero: 'Pedido {codigo}',
    recibido: 'Já chegou aqui, {nombre}. Confirmamos pelo WhatsApp em instantes.',
    estadoActual: 'Situação atual: {estado}.',
    loQuePediste: 'O que você pediu',
    subtotal: 'Subtotal',
    total: 'Total',
    datosEntrega: 'Dados de entrega',
    notas: 'Observações',
    guardaEnlace: 'Salve este link para acompanhar o pedido quando quiser.',
    seguirComprando: 'Continuar comprando',
    escribirWhatsApp: 'Falar pelo WhatsApp',
    consultaWhatsApp: 'Olá, queria saber do meu pedido {codigo}',
    cancelado: 'Pedido cancelado',
    canceladoLead: 'Se achar que foi um engano, fale com a gente pelo WhatsApp que verificamos.',
    pasoDe: 'Situação atual do pedido: {estado}. Passo {actual} de {total}.',
    pasos: {
      recibido: 'Recebido',
      recibidoHint: 'Seu pedido já chegou',
      confirmado: 'Confirmado',
      confirmadoHint: 'Confirmamos com você',
      preparacion: 'Em preparo',
      preparacionHint: 'Mãos à obra',
      listo: 'Pronto',
      listoHint: 'Pronto para sair',
      entregado: 'Entregue',
      entregadoHint: 'Aproveite!',
    },
  },

  horario: {
    titulo: 'Nosso horário',
    lead: 'Você pode retirar o pedido no ponto combinado ou agendar a entrega dentro destes horários.',
    hacerPedido: 'Fazer um pedido',
    escribenos: 'Fale com a gente',
    lunesViernes: 'Segunda a sexta',
    sabados: 'Sábados',
    domingos: 'Domingos',
  },

  frase: {
    cita: '"Um potinho de carinho de cada vez."',
    sub: 'Sem fórmulas estranhas — só bons ingredientes e tempo.',
  },

  footer: {
    descripcion:
      'Um pedacinho do Brasil em cada colherada — bolo no pote artesanal, camadas de pão de ló e brigadeiro montadas à mão em Valledupar. Kits para eventos e datas especiais.',
    explorar: 'Explorar',
    contacto: 'Contato',
    ubicacion: 'Valledupar, Colômbia',
    lema: 'Um potinho de carinho de cada vez',
    hechoPor: 'Feito por',
  },

  noEncontrado: {
    uy: 'Opa...',
    titulo: 'Este pote não existe',
    lead: 'A página que você procura acabou ou nunca esteve no balcão. Volte ao cardápio, que lá sempre tem algo fresquinho.',
    verCatalogo: 'Ver o cardápio',
    irInicio: 'Ir para o início',
  },

  categorias: {
    individual: 'Bolo no pote individual',
    mini: 'Mini bolo no pote',
    combo: 'Para compartilhar',
    eventos: 'Eventos',
    individualCorto: 'Individual',
    miniCorto: 'Mini',
    comboCorto: 'Combos',
    eventosCorto: 'Eventos',
  },

  entrega: {
    pickup: 'Retirar no ponto',
    delivery: 'Entrega em Valledupar',
    gratis: 'Grátis',
    sinCosto: 'Sem custo',
  },
};
