# TomoTrip Supabase API ドキュメント

このドキュメントでは、tomotrip.com から CenterDisplay（Replit）へフォームデータを送信する方法を説明します。

## 概要

CenterDisplay は固定APIとして機能し、以下のエンドポイントを提供します：
- `POST /api/supabase/reservations` - 予約リクエスト
- `POST /api/supabase/contacts` - お問い合わせ
- `POST /api/supabase/listings` - 掲載申込

すべてのデータは Supabase データベースに保存されます。

---

## セットアップ手順

### 1. Supabaseプロジェクトでテーブル作成

Supabaseダッシュボード → SQL Editor で `docs/supabase-setup.sql` を実行してください。

### 2. 環境変数の設定

Replitの環境変数に以下を設定：
- `SUPABASE_URL` - SupabaseプロジェクトURL
- `SUPABASE_ANON_KEY` - anon/public key

---

## APIエンドポイント

### ベースURL
```
https://YOUR-REPLIT-URL
```

### 共通仕様
- Content-Type: `application/json`
- 成功レスポンス: `{ "ok": true, "id": "uuid" }`
- 失敗レスポンス: `{ "ok": false, "error": "エラーメッセージ" }`

### スパム対策
全エンドポイントに `honeypot` フィールドを追加可能。値が入っていると拒否されます。

---

## 1. 予約リクエスト API

**POST /api/supabase/reservations**

### リクエストボディ
```json
{
  "store_id": "store-001",
  "store_name": "サンプル店舗",
  "guest_name": "山田太郎",
  "guest_email": "yamada@example.com",
  "guest_phone": "090-1234-5678",
  "reservation_date": "2026-02-01",
  "reservation_time": "18:00",
  "party_size": 4,
  "notes": "窓際の席希望",
  "honeypot": ""
}
```

### 必須フィールド
- `store_id` - 店舗ID
- `guest_name` - 予約者名
- `guest_email` - メールアドレス
- `reservation_date` - 予約日（YYYY-MM-DD形式）

### curlテスト例
```bash
curl -X POST https://YOUR-REPLIT-URL/api/supabase/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "store_id": "test-store-001",
    "store_name": "テスト店舗",
    "guest_name": "テスト太郎",
    "guest_email": "test@example.com",
    "reservation_date": "2026-02-01",
    "reservation_time": "19:00",
    "party_size": 2
  }'
```

---

## 2. お問い合わせ API

**POST /api/supabase/contacts**

### リクエストボディ
```json
{
  "name": "山田花子",
  "email": "hanako@example.com",
  "phone": "080-9876-5432",
  "message": "協賛店について質問があります。",
  "page_url": "https://tomotrip.com/sponsor-list/",
  "honeypot": ""
}
```

### 必須フィールド
- `name` - お名前
- `email` - メールアドレス
- `message` - お問い合わせ内容

### curlテスト例
```bash
curl -X POST https://YOUR-REPLIT-URL/api/supabase/contacts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "テスト花子",
    "email": "test@example.com",
    "message": "テストお問い合わせです。"
  }'
```

---

## 3. 掲載申込 API

**POST /api/supabase/listings**

### リクエストボディ
```json
{
  "store_name": "新規店舗名",
  "category": "飲食",
  "address": "沖縄県那覇市○○1-2-3",
  "contact_person": "担当者名",
  "email": "shop@example.com",
  "phone": "098-123-4567",
  "pr_text": "当店は沖縄料理の専門店です...",
  "website_url": "https://example.com",
  "sns_url": "https://instagram.com/example",
  "plan": "スタンダード",
  "honeypot": ""
}
```

### 必須フィールド
- `store_name` - 店舗名
- `category` - 業種カテゴリ
- `contact_person` - 担当者名
- `email` - メールアドレス

### curlテスト例
```bash
curl -X POST https://YOUR-REPLIT-URL/api/supabase/listings \
  -H "Content-Type: application/json" \
  -d '{
    "store_name": "テスト店舗",
    "category": "飲食",
    "contact_person": "テスト担当",
    "email": "listing@example.com",
    "phone": "098-000-0000",
    "pr_text": "テスト掲載申込です"
  }'
```

---

## tomotrip.com側 フォーム実装例（JavaScript）

```javascript
// 予約フォーム送信例
async function submitReservation(formData) {
  const API_BASE = 'https://YOUR-REPLIT-URL';
  
  try {
    const response = await fetch(`${API_BASE}/api/supabase/reservations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        store_id: formData.storeId,
        store_name: formData.storeName,
        guest_name: formData.name,
        guest_email: formData.email,
        guest_phone: formData.phone,
        reservation_date: formData.date,
        reservation_time: formData.time,
        party_size: formData.partySize,
        notes: formData.notes,
        honeypot: document.getElementById('hp_field')?.value || ''
      })
    });
    
    const result = await response.json();
    
    if (result.ok) {
      // 成功 - サンクスページへリダイレクト等
      window.location.href = '/thanks/reservation/';
    } else {
      // エラー表示
      alert('送信に失敗しました: ' + result.error);
    }
  } catch (error) {
    console.error('API Error:', error);
    alert('通信エラーが発生しました');
  }
}
```

---

## CORS設定

以下のオリジンからのリクエストが許可されています：
- `https://tomotrip.com`
- `https://www.tomotrip.com`
- `http://localhost:3000` (開発用)
- `http://localhost:5000` (開発用)

---

## ヘルスチェック

**GET /api/supabase/health**

Supabase接続状態を確認できます。

```bash
curl https://YOUR-REPLIT-URL/api/supabase/health
```

レスポンス例：
```json
{
  "ok": true,
  "configured": true,
  "timestamp": "2026-01-11T16:00:00.000Z"
}
```

---

## セキュリティ

1. **RLS (Row Level Security)**: Supabaseで有効化済み
   - INSERT のみ anon から許可
   - SELECT/UPDATE/DELETE は禁止

2. **Honeypot**: スパム対策として `honeypot` フィールドを使用
   - フォームに非表示フィールドを追加
   - ボットが自動入力すると拒否

3. **バリデーション**: サーバーサイドで必須項目・メール形式をチェック
