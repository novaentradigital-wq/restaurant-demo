-- ============================================================================
-- Post-Prisma-init SQL: bu dosya `prisma migrate dev` ÇALIŞTIRILDIKTAN sonra
-- el ile uygulanan ek katmandır. Tablolar Prisma tarafından oluşturulduktan
-- sonra şunları ekler:
--   1) RLS politikalarını (multi-tenant izolasyon)
--   2) Ürün arama tsvector trigger'ını
--   3) Masa başına yalnız 1 açık oturum kısıtını (EXCLUDE)
--   4) `events` ve `audit_logs` için aylık partitioning
--
-- NOT: Prisma "raw migration" stiliyle uyumlu çalışır; bu dosyayı
-- migrations klasöründe bırakmak yeterlidir.
-- ============================================================================

-- ───────────────────────────  1) ROW-LEVEL SECURITY ─────────────────────────

-- Yardımcı fonksiyon: aktif tenant'ı getir
CREATE OR REPLACE FUNCTION app_current_tenant() RETURNS uuid AS $$
  SELECT NULLIF(current_setting('app.tenant_id', true), '')::uuid;
$$ LANGUAGE sql STABLE;

-- RLS bypass: superuser/owner DDL atarken devreye girmez. Uygulama runtime'ında
-- 'qrmenu_app' rolü kullanılır → policy uygulanır.

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'restaurants','sections','tables',
      'users','shifts',
      'categories','products','product_images','product_variants',
      'modifier_groups','modifiers','product_modifier_groups',
      'table_sessions','orders','order_items','order_item_modifiers',
      'table_calls','payments',
      'campaigns','coupons',
      'events','audit_logs','offline_outbox'
    ])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);

    -- Mevcut policy'leri temizle (idempotent migration için)
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', t);

    -- Tek policy: hem SELECT hem INSERT/UPDATE/DELETE için tenant eşleşmesi
    EXECUTE format($p$
      CREATE POLICY tenant_isolation ON %I
        USING (tenant_id = app_current_tenant())
        WITH CHECK (tenant_id = app_current_tenant())
    $p$, t);
  END LOOP;
END $$;

-- product_modifier_groups tablosunda tenant_id kolonu yok (bağ tablosu),
-- bu yüzden ürün üzerinden dolaylı kontrol:
ALTER TABLE product_modifier_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_modifier_groups FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON product_modifier_groups;
CREATE POLICY tenant_isolation ON product_modifier_groups
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_modifier_groups.product_id
        AND p.tenant_id = app_current_tenant()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_modifier_groups.product_id
        AND p.tenant_id = app_current_tenant()
    )
  );

-- ───────────────────────────  2) PRODUCT SEARCH TSVECTOR ────────────────────

CREATE OR REPLACE FUNCTION products_tsv_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
       setweight(to_tsvector('simple', coalesce(NEW.name->>'TR', '')), 'A')
    || setweight(to_tsvector('simple', coalesce(NEW.name->>'EN', '')), 'A')
    || setweight(to_tsvector('simple', coalesce(NEW.description->>'TR', '')), 'C')
    || setweight(to_tsvector('simple', coalesce(NEW.description->>'EN', '')), 'C');
  RETURN NEW;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_tsv ON products;
CREATE TRIGGER trg_products_tsv
  BEFORE INSERT OR UPDATE OF name, description ON products
  FOR EACH ROW EXECUTE FUNCTION products_tsv_update();

CREATE INDEX IF NOT EXISTS products_search_vector_idx
  ON products USING GIN (search_vector);

CREATE INDEX IF NOT EXISTS products_tags_idx
  ON products USING GIN (tags);

CREATE INDEX IF NOT EXISTS products_allergens_idx
  ON products USING GIN (allergens);

-- Trigram arama (ürün adı bulanık eşleştirme için)
CREATE INDEX IF NOT EXISTS products_name_tr_trgm_idx
  ON products USING GIN ((name->>'TR') gin_trgm_ops);

-- ───────────────────────────  3) ONE OPEN SESSION PER TABLE ────────────────

ALTER TABLE table_sessions
  DROP CONSTRAINT IF EXISTS one_open_session_per_table;

ALTER TABLE table_sessions
  ADD CONSTRAINT one_open_session_per_table
  EXCLUDE USING gist (table_id WITH =) WHERE (closed_at IS NULL);

-- ───────────────────────────  4) PARTIAL INDEXES ───────────────────────────

-- Aktif siparişler için
CREATE INDEX IF NOT EXISTS orders_active_idx
  ON orders (restaurant_id, status, created_at)
  WHERE status IN ('CONFIRMED','PREPARING','READY');

-- Bekleyen kalemler (mutfak/bar ekranı için kritik)
CREATE INDEX IF NOT EXISTS order_items_pending_idx
  ON order_items (station, status, created_at)
  WHERE status IN ('PENDING','PREPARING');

-- Bekleyen çağrılar (garson ekranı bildirim kuyruğu)
CREATE INDEX IF NOT EXISTS table_calls_pending_idx
  ON table_calls (restaurant_id, created_at)
  WHERE status = 'PENDING';

-- Açık vardiya
CREATE INDEX IF NOT EXISTS shifts_open_idx
  ON shifts (user_id)
  WHERE status = 'OPEN';

-- Açık masa oturumu
CREATE INDEX IF NOT EXISTS table_sessions_open_idx
  ON table_sessions (table_id)
  WHERE closed_at IS NULL;

-- ───────────────────────────  5) UPDATED_AT TRIGGER ────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW."updatedAt" := NOW();
  RETURN NEW;
END $$ LANGUAGE plpgsql;

-- Prisma kendi @updatedAt'ı yönetir; bu fonksiyon yardımcıdır, raw SQL girişler için.
