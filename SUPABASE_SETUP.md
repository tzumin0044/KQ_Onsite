# Supabase Realtime 資料庫設定指南

本系統已整合 **Supabase Realtime** 雲端即時同步架構。請依照以下步驟在 Supabase 免費建立專案並啟用即時同步：

---

## 📌 步驟一：在 Supabase 建立專案與資料表

1. 前往 [Supabase 官網 (https://supabase.com)](https://supabase.com) 登入或免費註冊。
2. 點擊 **New Project** 建立一個新專案。
3. 進入專案後，點選左側選單的 **SQL Editor** ➜ 點擊 **New query**。
4. 複製並貼上以下完整 SQL 語法，然後點擊右下角的 **Run** 執行：

```sql
-- 1. 建立系統狀態表 (儲存人員、路線、組別配置與今日路線進度)
CREATE TABLE IF NOT EXISTS app_state (
    id TEXT PRIMARY KEY DEFAULT 'main',
    config JSONB NOT NULL,
    today_routes JSONB NOT NULL,
    last_reset_date TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 建立歷史作業紀錄表 (永久保存歷史紀錄供查詢與 Excel 匯出)
CREATE TABLE IF NOT EXISTS history_logs (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    timestamp BIGINT NOT NULL,
    shift TEXT NOT NULL,
    shift_name TEXT NOT NULL,
    route_name TEXT NOT NULL,
    role TEXT NOT NULL,
    role_name TEXT NOT NULL,
    group_name TEXT NOT NULL,
    user_name TEXT NOT NULL,
    action TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 啟用 Realtime 即時推播 (極速推播至所有電腦/手機)
ALTER PUBLICATION supabase_realtime ADD TABLE app_state;
ALTER PUBLICATION supabase_realtime ADD TABLE history_logs;

-- 4. 啟用 RLS 並開放匿名讀寫 (便於現場免登入金鑰存取)
ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE history_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-write app_state" ON app_state FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write history_logs" ON history_logs FOR ALL USING (true) WITH CHECK (true);
```

---

## 🔑 步驟二：取得 API 金鑰並填入本專案

1. 點擊 Supabase 左側選單的 **Project Settings** ➜ **API**。
2. 找到：
   - **Project URL**（例如：`https://xxxxxxxxxxxx.supabase.co`）
   - **Project API keys** 裡面的 **`anon public`** 金鑰（例如：`eyJhbGciOi...`）
3. 開啟本專案中的 `src/supabase.js` 或建立 `.env` 檔案：
   ```env
   VITE_SUPABASE_URL=https://您的專案ID.supabase.co
   VITE_SUPABASE_ANON_KEY=您的anon公鑰
   ```
4. 設定完成後，所有連線的裝置（手機、平板、電視大螢幕、電腦）將會進行 **<50ms 毫秒級** 的即時狀態連動！
