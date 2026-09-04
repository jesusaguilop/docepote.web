# Arquitectura

Este documento explica **por qué** el código está organizado así. Si vas a
tocar algo y no entiendes una decisión, probablemente esté justificada aquí.

## La idea en una frase

El negocio (qué es un pedido, cuándo se puede vender un pote, cuánto cuesta un
domicilio) vive en `src/core` y **no sabe** que existen Next.js, Prisma, React
ni WhatsApp. Todo lo demás es un detalle enchufable alrededor.

```
┌─────────────────────────────────────────────────────────────┐
│  src/app + src/components        Presentación (Next, React) │
│    páginas, Server Actions, UI                              │
└────────────────────────┬────────────────────────────────────┘
                         │ usa
┌────────────────────────▼────────────────────────────────────┐
│  src/core/application            Casos de uso               │
│    PlaceOrder, ListProducts, Login…                         │
│    define PUERTOS: PaymentGateway, Clock, TransactionRunner │
└────────────────────────┬────────────────────────────────────┘
                         │ usa
┌────────────────────────▼────────────────────────────────────┐
│  src/core/domain                 Dominio puro               │
│    Order, Product, Flavor, Cart, Money, DeliveryPolicy      │
│    define PUERTOS: ProductRepository, OrderRepository       │
│    ← cero imports externos, ni siquiera de Node             │
└─────────────────────────────────────────────────────────────┘
                         ▲ implementa
┌────────────────────────┴────────────────────────────────────┐
│  src/infrastructure              Adaptadores                │
│    Prisma, scrypt, WhatsApp, Wompi, reloj, uuid             │
│    container.ts = Composition Root                          │
└─────────────────────────────────────────────────────────────┘
```

Las flechas apuntan **hacia adentro**. La infraestructura depende del dominio;
nunca al revés.

## Los principios SOLID, y dónde se ven

No como etiquetas: como decisiones con consecuencias concretas.

### S — Responsabilidad única

Un caso de uso por operación de negocio, con un solo método `execute`
(`src/core/application/**`). Cuando uno empieza a necesitar tres repositorios
y un `if` de veinte ramas, casi siempre había dos operaciones escondidas ahí.

`Money` solo sabe de dinero. `OrderCode` solo genera y valida códigos.
`DeliveryPolicy` solo decide cuánto cuesta llevar un pedido.

### O — Abierto/cerrado

`PaymentGateway` (`application/ports/payment-gateway.ts`) es el ejemplo real:
hoy corre `WhatsAppOrderGateway`, y activar Wompi es cambiar una variable de
entorno. `PlaceOrderUseCase` no se toca, la UI del checkout tampoco, la base de
datos tampoco.

Lo mismo con la máquina de estados del pedido: agregar "en camino" se hace en
`ordering/order-status.ts` y el panel muestra el botón nuevo solo, porque
pregunta `allowedTransitionsFrom()` en vez de tener su propia copia de las
reglas.

### L — Sustitución de Liskov

`InMemoryProductRepository` y `PrismaProductRepository` implementan el mismo
puerto y son intercambiables sin que ningún caso de uso lo note. Los tests de
`tests/place-order.test.ts` corren contra los primeros; producción usa los
segundos. Mismo código de negocio, cero `if (isTest)`.

Igual con `SystemClock` / `FixedClock` y `UuidGenerator` /
`SequentialIdGenerator`.

### I — Segregación de interfaces

Los puertos están partidos por uso: `ProductReader` y `ProductWriter`
(`domain/catalog/product.repository.ts`). La tienda pública solo depende del
primero; el panel es el único que además escribe. Ningún caso de uso de lectura
arrastra métodos que no usa.

### D — Inversión de dependencias

El dominio declara interfaces; la infraestructura las implementa. El único
lugar donde se decide qué implementación concreta se usa es
`src/infrastructure/container.ts` — el *composition root*. Cambiar de SQLite a
Postgres, de scrypt a argon2 o de WhatsApp a Wompi se hace ahí y en ningún otro
archivo.

Que los tests puedan sustituir repositorios, reloj, generador de ids y pasarela
de pago sin un solo mock ni monkey-patching es la prueba de que la inversión
está bien hecha.

## Decisiones que vale la pena conocer

### El dinero es entero, siempre

`Money` (`domain/shared/money.ts`) guarda enteros en la unidad mínima de la
moneda. El peso colombiano no usa centavos, así que `COP.decimals = 0` y los
montos son pesos enteros. **Nunca** uses `number` con decimales para precios:
`Money.of(9500.5)` lanza a propósito.

### El precio nunca viene del navegador

El carrito (`domain/ordering/cart.ts`) guarda solo `{productId, quantity}`.
Ningún precio. El cliente puede editar su `localStorage` a gusto: al confirmar,
`PlaceOrderUseCase` vuelve a leer los precios del catálogo y recalcula todo,
incluido el domicilio. Hay un test que lo fija.

### Las líneas del pedido son una foto

`OrderLine` copia nombre y precio del producto al momento de la compra. Si
mañana sube el precio, los pedidos históricos siguen mostrando lo que el
cliente realmente pagó.

### Los sabores son una entidad, no un campo

El mismo sabor vive en varios productos (Chocolatudo es individual y también
mini, y el kit de eventos los lleva todos). Si la descripción estuviera copiada
dentro de cada producto, corregir una receta obligaría a editarla en cinco
sitios y tarde o temprano quedarían distintas.

Se cargan en lote con `loadFlavorIndex` para no disparar una consulta por
tarjeta (N+1).

### Crear un pedido es atómico

Guardar la orden y descontar el inventario ocurren dentro de
`TransactionRunner` (`infrastructure/persistence/prisma/client.ts`), que usa
`AsyncLocalStorage` para que los repositorios resuelvan solos el cliente
transaccional. Sus firmas quedan limpias y el dominio nunca se entera de que
Prisma existe.

### Las entidades no cruzan al cliente

React Server Components solo serializa objetos planos, y las entidades son
clases con métodos. Por eso existen los DTOs (`application/dto/**`): la
frontera servidor→cliente, con los precios ya formateados para que la UI no
cargue con `Money` ni con locales.

### Cada Server Action valida su propia sesión

Una Server Action es un endpoint público: el navegador puede llamarla sin haber
cargado el layout protegido. Por eso `requireAdminForAction()` se repite en
cada acción de escritura (`app/actions/admin.ts`) aunque el layout ya proteja
la página. Confiar en el layout es exactamente cómo se filtra un panel.

## Estructura de carpetas

```
prisma/                      esquema y semilla
public/brand/                assets de la marca (mascota, textura, empaque)
src/
  app/                       rutas de Next
    (tienda)/                tienda pública — layout con carrito y avisos
    admin/                   panel
      login/                 fuera del guard, obviamente
      (panel)/               protegido por requireAdmin()
    actions/                 Server Actions
    api/webhooks/wompi/      webhook con verificación de firma
  components/
    brand/                   JarIcon, Logo
    store/                   UI de la tienda
    admin/                   UI del panel
    ui/                      Button, Toast, Reveal
  core/
    domain/                  entidades, objetos de valor, puertos
    application/             casos de uso, DTOs, puertos de servicios
  infrastructure/
    persistence/prisma/      repositorios reales
    persistence/in-memory/   repositorios para tests
    payments/                WhatsApp y Wompi
    auth/                    scrypt y cookie de sesión
    config/env.ts            configuración validada con Zod
    container.ts             composition root
tests/                       dominio y casos de uso, sin BD
```

## Migrar a Postgres

1. Corre `npm run db:use-postgres` (ajusta el provider y agrega `directUrl`).
2. Pon la `DATABASE_URL` y la `DIRECT_URL` de Neon en el `.env`.
3. `npx prisma db push && npm run db:seed`.

El esquema se diseñó compatible a propósito: no usa enums nativos ni arrays,
que SQLite no soporta. Los valores acotados (categoría, estado, patrón) se
validan en el dominio, que es donde deben vivir esas reglas.

## Activar Wompi

En el `.env`:

```
PAYMENT_GATEWAY="wompi"
WOMPI_PUBLIC_KEY="pub_prod_xxx"
WOMPI_PRIVATE_KEY="prv_prod_xxx"
WOMPI_INTEGRITY_SECRET="prod_integrity_xxx"
WOMPI_EVENTS_SECRET="prod_events_xxx"
WOMPI_ENVIRONMENT="production"
```

Y registra el webhook apuntando a `https://tu-dominio/api/webhooks/wompi`.
No hay que tocar código: `WompiGateway` ya implementa `PaymentGateway` y la
verificación de firma del webhook.
