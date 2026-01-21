# 予約機能テスト手順

## テストパターン

### 1. 空欄テスト (400エラー確認)
- メールアドレス: 空
- 電話番号: 空
- 期待結果: `❌ [RESERVATION] FAIL: CONTACT_INFO_REQUIRED | email=false phone=false | 400`

### 2. 不正形式テスト (400エラー確認)

#### 2a. 不正なメールアドレス
- メールアドレス: `test` (@ なし)
- 電話番号: `09012345678`
- 期待結果: `❌ [RESERVATION] FAIL: INVALID_EMAIL | email=***@unknown | 400`

#### 2b. 不正な電話番号
- メールアドレス: `test@example.com`
- 電話番号: `123` (桁数不足)
- 期待結果: `❌ [RESERVATION] FAIL: INVALID_PHONE | digits=3 | 400`

### 3. 正常テスト (201成功確認)
- メールアドレス: `test@example.com`
- 電話番号: `09012345678`
- 期待結果:
  - `✅ [RESERVATION] OK: id=xxx | guide=xxx | date=xxx | email=***@example.com | 201`
  - `✅ [EMAIL] OK: to=***@example.com | provider=simulation | msgId=SIM-xxx`

## ログ確認ポイント

### 予約API (reservationAPI.js)
- 成功: `✅ [RESERVATION] OK: ...`
- 失敗: `❌ [RESERVATION] FAIL: ...`

### メールサービス (emailService.js)
- 成功: `✅ [EMAIL] OK: to=*** | provider=xxx | msgId=xxx`
- 失敗: `❌ [EMAIL] FAIL: to=*** | provider=xxx | error=xxx`

## 個人情報マスク
- メールアドレス: `***@ドメイン` 形式 (例: `***@gmail.com`)
- 電話番号: ログには桁数のみ表示
