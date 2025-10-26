# Corrección de Base de Datos

Si ya ejecutaste la primera migración y estás experimentando errores, sigue estos pasos:

## Paso 1: Ejecutar la Migración de Corrección

Ve a tu [Supabase Dashboard SQL Editor](https://app.supabase.com/project/_/sql) y ejecuta el siguiente SQL:

```sql
-- Add foreign key constraint from subscriptions to prices (if not exists)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'subscriptions_price_id_fkey'
  ) then
    alter table public.subscriptions
      add constraint subscriptions_price_id_fkey
      foreign key (price_id)
      references public.prices(id)
      on delete restrict;
  end if;
end $$;

-- Add index on price_id if not exists
create index if not exists subscriptions_price_id_idx on public.subscriptions (price_id);

-- Update current_period columns to allow null (in case of incomplete subscriptions)
alter table public.subscriptions
  alter column current_period_start drop not null,
  alter column current_period_end drop not null;
```

Alternativamente, puedes copiar y ejecutar todo el contenido de:
`supabase/migrations/00002_add_foreign_key.sql`

## Paso 2: Reiniciar el Servidor de Desarrollo

```bash
# Detén el servidor actual (Ctrl+C)
# Luego reinícialo
pnpm dev
```

## Paso 3: Probar el Flujo de Suscripción Nuevamente

1. Ve a http://localhost:5173/pricing
2. Haz clic en "Subscribe"
3. Completa el checkout en Stripe
4. Verifica que la suscripción aparezca en tu dashboard

## Cambios Realizados

### 1. Arreglado Manejo de Timestamps
- Agregada función helper `toISOString()` que maneja valores `null` y `undefined` de forma segura
- Esto previene el error "Invalid time value" cuando Stripe envía timestamps nulos

### 2. Agregada Foreign Key
- Ahora existe una relación explícita entre `subscriptions.price_id` y `prices.id`
- Esto permite que las queries con joins funcionen correctamente
- Mejora la integridad de los datos

### 3. Columnas Nullable
- `current_period_start` y `current_period_end` ahora permiten `null`
- Esto maneja casos donde subscripciones están incompletas o en proceso

## Verificación

Después de aplicar la migración, puedes verificar que todo está correcto:

```sql
-- Verificar que la foreign key existe
SELECT conname, conrelid::regclass, confrelid::regclass
FROM pg_constraint
WHERE conname = 'subscriptions_price_id_fkey';

-- Verificar índices
SELECT indexname FROM pg_indexes
WHERE tablename = 'subscriptions';
```

Deberías ver:
- Foreign key: `subscriptions_price_id_fkey`
- Índices incluyendo: `subscriptions_price_id_idx`

## Eventos de Webhook No Manejados

Los mensajes "Unhandled event type" son normales. Estos eventos no requieren acción:
- `customer.created` - Ya manejamos customers al crear checkout
- `charge.succeeded` - Información incluida en subscription events
- `checkout.session.completed` - No necesitamos procesarlo
- `invoice.*` - Información incluida en subscription events
- `payment_intent.*` - Manejado automáticamente por Stripe

Los eventos críticos que SÍ manejamos:
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `product.created/updated`
- ✅ `price.created/updated`
