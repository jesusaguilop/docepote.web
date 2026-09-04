# Desplegar en Vercel con Neon

Local corre con SQLite y cero configuración. Producción **no puede**: el disco
de las funciones serverless de Vercel es efímero y de solo lectura, así que un
archivo `.db` se perdería en cada despliegue. Por eso Neon.

## Por qué Neon y no Supabase

Ambos son Postgres gestionado con plan gratis. La diferencia que importa aquí:

- **Supabase (free)** pausa el proyecto entero tras unos días sin actividad y
  hay que ir a restaurarlo **a mano** desde el panel. Si la tienda pasa una
  semana tranquila, el siguiente cliente se encuentra la página caída.
- **Neon (free)** suspende el cómputo a los ~5 minutos de inactividad, pero lo
  **despierta solo** en la siguiente consulta, en menos de un segundo. No hay
  nada que restaurar.

El costo de Neon es una latencia extra de unos cientos de milisegundos en la
primera visita después de un rato quieto. A cambio, la tienda nunca queda
inaccesible por estar dormida.

Son 10 minutos. Sigue el orden.

---

## 1. Crear la base en Neon

1. Entra a [neon.tech](https://neon.tech) y crea una cuenta (puedes entrar con
   GitHub).
2. **Create project**. Nombre `docepote`, versión de Postgres la que venga por
   defecto, y la región más cercana — `AWS US East (Ohio)` va bien para
   Colombia.
3. Al terminar te muestra la cadena de conexión. Ahí mismo, en el desplegable
   **Connection string**, necesitas copiar **dos** variantes:

   | Opción en Neon                      | Va en          |
   | ----------------------------------- | -------------- |
   | Con **Connection pooling** activado | `DATABASE_URL` |
   | Con **Connection pooling** apagado  | `DIRECT_URL`   |

   Se distinguen a simple vista: la del pooler lleva `-pooler` en el host.

   ```
   DATABASE_URL="postgresql://usuario:clave@ep-xxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
   DIRECT_URL="postgresql://usuario:clave@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
   ```

   Deja el `?sslmode=require`: Neon lo exige.

**Por qué dos:** la app corre en serverless y abre y cierra conexiones
constantemente — sin pooler agota el límite de Postgres. Pero el pooler no
soporta crear ni migrar tablas, y para eso Prisma necesita la conexión directa.

---

## 2. Crear las tablas y sembrar

Desde tu máquina, con las dos cadenas ya en el `.env`:

```bash
npx prisma db push     # crea las tablas en Neon
npm run db:seed        # carga sabores, productos y el admin
```

El esquema del repositorio ya viene configurado para PostgreSQL, así que no
hay que cambiar nada antes.

Verifica en Neon → **Tables** que aparezcan `Product`, `Flavor`, `Order`,
`OrderLine`, `AdminUser` y `Session`.

> Para volver a trabajar en local con SQLite corre `npm run db:use-sqlite`,
> pero acuérdate de `npm run db:use-postgres` antes de hacer commit: Vercel
> compila el esquema tal como esté en el repositorio.

---

## 3. Desplegar en Vercel

1. Entra a [vercel.com/new](https://vercel.com/new) e importa el repositorio
   `jesusaguilop/docepote.web`.
2. Vercel detecta Next.js solo. No cambies nada del build.
3. En **Environment Variables**, agrega:

   | Variable                      | Valor                                       |
   | ----------------------------- | ------------------------------------------- |
   | `DATABASE_URL`                | La del pooler (con `-pooler` en el host)     |
   | `DIRECT_URL`                  | La directa (sin `-pooler`)                   |
   | `NEXT_PUBLIC_SITE_URL`        | `https://tu-dominio.vercel.app`              |
   | `NEXT_PUBLIC_WHATSAPP_NUMBER` | `573180173770`                               |
   | `NEXT_PUBLIC_INSTAGRAM`       | `docepotevup`                                |
   | `SESSION_SECRET`              | Algo largo y aleatorio (ver abajo)           |
   | `PAYMENT_GATEWAY`             | `whatsapp`                                   |
   | `DELIVERY_FEE_COP`            | `5000`                                       |
   | `FREE_DELIVERY_THRESHOLD_COP` | `60000`                                      |

   Para el secreto de sesión:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. **Deploy**.

El `build` del proyecto ya corre `prisma generate` antes de compilar, así que
el cliente se genera con el esquema correcto en cada despliegue.

> Si el proyecto de Neon estaba dormido, el primer build lo despierta solo. No
> tienes que hacer nada.

---

## 4. Después del primer despliegue

1. Vuelve a Vercel y corrige `NEXT_PUBLIC_SITE_URL` con el dominio real que te
   asignó. Redespliega. *(Importa: es la URL de seguimiento que va dentro del
   mensaje de WhatsApp de cada pedido. Si queda en `localhost`, tus clientes
   reciben un enlace muerto.)*
2. Entra a `https://tu-dominio.vercel.app/admin` y **cambia la contraseña del
   administrador**. Las credenciales del seed son públicas — están en este
   repositorio.

   Para cambiarla: ajusta `ADMIN_EMAIL` y `ADMIN_PASSWORD` en tu `.env` local
   (apuntando a Neon) y corre `npm run db:seed`. Si el correo ya existe el seed
   no lo toca, así que usa un correo distinto o borra el usuario anterior desde
   la consola de Neon.

---

## Cuando llegue Wompi

No hay que tocar código. En las variables de entorno de Vercel:

```
PAYMENT_GATEWAY=wompi
WOMPI_PUBLIC_KEY=pub_prod_xxx
WOMPI_PRIVATE_KEY=prv_prod_xxx
WOMPI_INTEGRITY_SECRET=prod_integrity_xxx
WOMPI_EVENTS_SECRET=prod_events_xxx
WOMPI_ENVIRONMENT=production
```

Y en el panel de Wompi, registra el webhook apuntando a:

```
https://tu-dominio.vercel.app/api/webhooks/wompi
```

Redespliega y listo. El adaptador ya valida la firma de integridad al cobrar y
la firma del evento al recibir el webhook.

---

## Problemas comunes

**«Can't reach database server»** — casi siempre es la contraseña sin
reemplazar en la cadena, o caracteres especiales sin codificar. Si tu
contraseña tiene `@`, `#` o `/`, hay que escaparlos en la URL.

**«prepared statement already exists»** — estás usando la cadena del pooler
donde va la directa, o al revés. Revisa cuál lleva `-pooler`.

**«SSL connection required»** — le falta `?sslmode=require` al final.

**Las tablas no existen** — el `prisma db push` del paso 2 no llegó a correr, o
corrió contra la base equivocada. Revísalo en Neon → *Tables*.

**El catálogo sale vacío** — faltó `npm run db:seed`, o se corrió contra
SQLite. Comprueba que el `.env` local apuntaba a Neon al ejecutarlo.

**La primera visita del día tarda un segundo** — es Neon despertando. Normal en
el plan gratis, y se resuelve solo.
