-- TomoTrip Supabase テーブル作成SQL
-- このSQLをSupabaseダッシュボードのSQL Editorで実行してください

-- =============================================================================
-- 1. reservations テーブル（予約リクエスト）
-- =============================================================================
CREATE TABLE IF NOT EXISTS reservations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id TEXT NOT NULL,
    store_name TEXT,
    guest_name TEXT NOT NULL,
    guest_email TEXT NOT NULL,
    guest_phone TEXT,
    reservation_date DATE NOT NULL,
    reservation_time TEXT,
    party_size INTEGER,
    notes TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- reservations用RLSを有効化
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- anonユーザーからのINSERTを許可（公開フォーム用）
CREATE POLICY "Allow anonymous insert on reservations"
ON reservations FOR INSERT
TO anon
WITH CHECK (true);

-- SELECT/UPDATE/DELETEは禁止（管理画面ができるまで）
-- 管理者用は後でauthenticated roleに許可を追加

-- =============================================================================
-- 2. contacts テーブル（お問い合わせ）
-- =============================================================================
CREATE TABLE IF NOT EXISTS contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT NOT NULL,
    page_url TEXT,
    status TEXT DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- contacts用RLSを有効化
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- anonユーザーからのINSERTを許可
CREATE POLICY "Allow anonymous insert on contacts"
ON contacts FOR INSERT
TO anon
WITH CHECK (true);

-- =============================================================================
-- 3. listings テーブル（掲載申込）
-- =============================================================================
CREATE TABLE IF NOT EXISTS listings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_name TEXT NOT NULL,
    category TEXT NOT NULL,
    address TEXT,
    contact_person TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    pr_text TEXT,
    website_url TEXT,
    sns_url TEXT,
    plan TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- listings用RLSを有効化
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- anonユーザーからのINSERTを許可
CREATE POLICY "Allow anonymous insert on listings"
ON listings FOR INSERT
TO anon
WITH CHECK (true);

-- =============================================================================
-- インデックス（パフォーマンス最適化）
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_reservations_store_id ON reservations(store_id);
CREATE INDEX IF NOT EXISTS idx_reservations_created_at ON reservations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);

-- =============================================================================
-- 確認用クエリ
-- =============================================================================
-- SELECT * FROM reservations ORDER BY created_at DESC LIMIT 10;
-- SELECT * FROM contacts ORDER BY created_at DESC LIMIT 10;
-- SELECT * FROM listings ORDER BY created_at DESC LIMIT 10;
