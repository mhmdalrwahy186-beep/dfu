# Changelog｜繁體中文

[English](CHANGELOG.md) · [繁體中文](CHANGELOG.zh-TW.md) · [简体中文](CHANGELOG.zh-CN.md)<br>
[README](README.md) · [繁體中文](README.zh-TW.md) · [简体中文](README.zh-CN.md)

Interior Design Master 的重要變更會記錄在這裡。版本號描述 Skill 套件與資料契約，不代表每一個相容的 3D runtime 都已實作所有可選功能。

## [0.2.3] — 2026-09-11

### 變更

- 為 repository 的原始內容加入 MIT License。
- 審核公開 README，移除 host-local validator 指令，保留公開的 Node、build 與瀏覽器檢查。
- 將 reference implementation notes 改寫為公開 provenance 說明，移除私有專案語境。

### 已驗證

- README 本地連結均可解析，文件中的檢查可從 repository root 執行。
- `node scripts/test-scripts.mjs` 與 `examples/minimal-case` 的 strict 驗證通過。
- `runtime-starter` 執行 `npm run build` 成功。

## [0.2.1] — 2026-09-10

由一次 clean-room 測試發現的五個問題（一個由圖片撰寫、strict 驗證通過、帶有 IKEA 台灣沙發產品的真實一房+彈性房戶型）。

### 修復

- `placeProduct(productId)` 在不帶座標呼叫時，會使用整個平面圖的外接框中心，在真實戶型裡往往落在牆上或很窄的房間裡。現在會先解析出目標房間——由目前 `style.json` 的 `furnitureRoles[]` 中與該產品角色相符的條目指定的房間，否則取最大的室內非濕區房間（與 inside/walk 相機原本使用的規則相同）——再以該房間多邊形的重心為落點。由於一件又長又窄的家具若以旋轉角 0 落入 x 軸比 z 軸窄的房間，無論探測點如何偏移都不可能通過既有的螺旋重疊搜尋，預設路徑現在會先讓家具以「長邊對齊房間長邊」的方向落地，再交給該螺旋搜尋處理，搜尋本身未變動。`runtime-starter/scripts/smoke.mjs` 的 "places a product proxy" 檢查現在會走這條預設路徑（不帶顯式座標），並在細節中回報所選房間與來源（`style-role`、`largest-indoor-room` 或 `bbox-fallback`）。
- 當 `public/textures` 與 `public/hdri` 為空（尚未執行 `fetch-assets.mjs` 的全新複製）時，頁面會拋出 `pageerror: Cannot read properties of undefined (reading 'image')`。根因：Vite 開發/預覽伺服器對缺失的靜態資源會以 200 加 SPA 回退的 `index.html` 回應，而非 404；three.js 的 `HDRLoader`/`DataTextureLoader` 在把這段 HTML 當作 HDR 檔案解析時會拋錯，且其自身的 `catch` 分支呼叫 `onError` 後仍會繼續往下使用那個從未賦值的解析結果，拋出未捕獲的錯誤。`runtime-starter/src/render.js` 現在會先檢查回應開頭位元組是否為真正的 RADIANCE/RGBE 魔數（`#?`），再決定要不要交給 `HDRLoader`，這條壞路徑因此完全不會被觸發；`RoomEnvironment` 加程序化畫布貼圖的後備方案在兩種情況下都能零頁面錯誤地撐起場景。已驗證資源缺失與資源齊全兩種狀態下皆為 17/17。
- `SKILL.md` 的 "Start from runtime-starter" 區塊、`references/runtime-adapter.md`，以及三份 README 的快速開始，現在都明確說明並用 `cd` 展示：`fetch-assets.mjs`、`link-case.mjs`、`smoke.mjs` 要在複製出來的 `runtime-starter`/viewer 目錄裡執行；`init-case.mjs`、`validate-case.mjs`、`check-product-links.mjs`、`image-inventory.mjs`、`test-scripts.mjs` 則是 Skill 自己另一份 `scripts/`，在 Skill 根目錄執行。
- `references/input-contract.md` "Image and drawing handling" 第 5 點新增一個從無比例尺的行銷戶型圖中的雙人床（並簡述標準門扇）推導 `metresPerPixel` 的實作範例，對應的 `plan.json.source`（`scaleStatus: "estimated"`、`metresPerPixel`）與帶 `basis` 的 `assumptions[]` 條目寫法，並說明內建的 `examples/minimal-case` 是一份 `scaleStatus: "confirmed"` 的已授權戶型圖，不會走到這條估算路徑。
- `scripts/image-inventory.mjs` 原本只解析 PNG 與 JPEG 的尺寸。現在也會解析 WebP（VP8、VP8L、VP8X 三種表頭）與 GIF；對未解析的格式（avif、svg、pdf、bmp）會明確回報 `"dimensions": null` 並附上 `"dimensionsNote": "not probed for this format"`，不再是無聲的 `null`。`references/input-contract.md` 第 1 點說明了哪些格式會被探測尺寸。`scripts/test-scripts.mjs` 新增一個 WebP 測試樣例（一段產生的最小 VP8L 表頭），斷言解析出的寬高。

### 已驗證

- 針對 clean-room 案例（資源缺失）執行 `node runtime-starter/scripts/smoke.mjs`：17 通過、0 失敗，主控台/頁面均無錯誤，預設落點透過 `style-role` 把沙發放進了 `rm-living`。
- 針對 `examples/minimal-case`（資源齊全，真實 HDRI 已載入）執行 `node runtime-starter/scripts/smoke.mjs`：17 通過、0 失敗。
- `node scripts/test-scripts.mjs`：全部通過，含新增的 WebP 測試斷言。
- `node scripts/validate-case.mjs examples/minimal-case --strict`：`valid: true`。

## [0.2.0] — 2026-09-10

### 新增

- 加入 `runtime-starter/`：以案例 JSON 契約驅動的 Vite 與 Three.js viewer，讓複製 Skill 資料夾的人不必先自行建立 runtime，就能得到可執行、可編輯的住宅 3D viewer。
- 加入 `examples/minimal-case`：通過 strict 驗證、含一筆真實且已檢查連結的商品資料的案例，並預先連到 starter 的 `public/case/`。
- 加入 `runtime-starter/scripts/fetch-assets.mjs`，可選下載 CC0 Poly Haven HDRI 與 PBR 貼圖；沒有這些檔案時回退到 `RoomEnvironment` 與程序化貼圖。
- 加入 `runtime-starter/scripts/link-case.mjs`，把案例的 JSON 複製到執行中的 viewer。
- 加入 `runtime-starter/scripts/smoke.mjs`：Playwright 檢查，涵蓋桌機與手機截圖、console error、視角切換、代理模型擺放與分享連結來回編碼。
- 加入 `scripts/test-scripts.mjs`：Skill 自身腳本的離線自我測試。
- 加入高／中／低三段畫質，只保留一個控制項，寬度 800px 以下預設為中，選擇記在 `idm-render-quality`。

### 變更

- 將 SKILL.md frontmatter 的 description 改寫為只描述觸發條件的第三人稱句子，包含中英文觸發詞，且不摘要工作流程。
- 精簡 SKILL.md 本文，只保留 gate 清單、runtime-starter 起手路徑、狀態與證據指令、誠實邊界、紅旗清單與續作規則。產品研究與 runtime 細節改由原本就涵蓋這些內容的 reference 承接。
- 讓 `validate-case.mjs` 與隨附 schema 對齊，`--strict` 會完整檢查。
- `check-product-links.mjs` 改為把 `blocked`（403、429、503、網路錯誤）與 `failed`（404 之類）分開回報，只有 `failed` 會以非零狀態結束；`blocked` 記為 `unverified`，不視為通過。
- 重寫 `references/runtime-adapter.md`，以 runtime-starter 為預設 runtime，含模組對照表、API 介面、畫質分級契約、替換既有 runtime 的作法，以及從參考專案驗證紀錄蒸餾出的可通用經驗。
- 更新 `references/validation-and-delivery.md`：加入 smoke 步驟、離線自我測試，以及 blocked 與 failed 的區別。
- 讓概念效果圖階段在 Claude Code 上有具體作法：使用可用的影像生成 MCP server、skill 或已設定的 API；都沒有時將該階段記為 skipped。
- 更新三份 README：加入快速開始、畫質分級，以及「已內含 runtime」的能力欄位。0.1.0 中「仍需要外部相容 runtime」的邊界不再適用。

### 驗證

- `node scripts/test-scripts.mjs`：23 項離線斷言全數通過，exit 0。
- `node scripts/validate-case.mjs examples/minimal-case --strict`：驗證通過，0 個錯誤、0 個警告（6 個房間、2 種風格、1 項商品）。
- `node scripts/check-product-links.mjs examples/minimal-case`：檢查 1 個網址，HTTP 200，0 個失敗、0 個 blocked。範例商品：IKEA EKTORP 三人座沙發（Hakebo 深灰），官方 GB 頁面，尺寸於 2026-09-10 從頁面讀取。
- runtime-starter：`npm install` 與 `npm run build` 成功（three r183、Vite 7）。`node scripts/fetch-assets.mjs` 下載 27 個 CC0 Poly Haven 檔案，sha256 皆驗證通過。
- `node scripts/smoke.mjs`（Playwright Chromium、SwiftShader、vite preview）：17 項通過、0 項失敗；桌機 1440×900 與手機 390×844 截圖；兩者 console error 皆為零；HDRI 環境作用中；視角預設切換、商品代理模型擺放並保留 productId、focusItem、分享連結雜湊（share-hash）來回編解碼、低／中／高畫質分級與持久化、手機預設中畫質、exportProducts 帶出證據、漫遊碰撞，均已驗證。
- 未驗證：真實手機的 GPU 表現（手機測試為軟體算圖下的模擬視窗）、iOS 假全螢幕（fake-fullscreen）備援、透過 geometry.assetPath 載入 GLB（程式路徑存在，但沒有範例提供模型）、分享連結的剪貼簿複製（編解碼已由來回測試涵蓋）。

## [0.1.0] — 2026-09-09

### 新增

- 建立可供 Codex 與 Claude Code 使用的 `interior-design-master` reusable Skill。
- 建立從戶型圖輸入、空間規格、白模審查、風格層、產品研究、互動 3D 整合到瀏覽器 QA 的分階段流程。
- 加入詳細 3D 家具配置前先生成 2–4 個 AI 概念方案的 concept-render bridge；前提是 host 提供影像生成工具。
- 加入 `concept-renders.json`、Schema、provenance 要求、選中／淘汰狀態，以及概念圖不能建立幾何或產品事實的規則。
- 加入 plan、style、furniture-product 與 case-state Schema，使用穩定 ID 並明確區分 confirmed／estimated／inferred／unknown。
- 對可購買推薦加入 live 家具研究要求：精確變體、毫米尺寸、來源證據、直接購買網址、市場／日期情境、幾何策略與適配狀態。
- 加入 `init-case.mjs`、`image-inventory.mjs`、`validate-case.mjs` 與 `check-product-links.mjs`。
- 加入 orbit、透視、軸測、俯視／2D 平面、第一人稱漫遊、碰撞、編輯歷史、吸附、儲存／分享、截圖、匯出與產品面板的 runtime 指引。
- 從參考住宅空間設計專案蒸餾可重用模式，但不複製其範例座標、私人輸入、模型資產、部署資料或驗證收據。
- 加入研究導向的 roadmap：自然語言編輯、方案比較、預算、掃描匯入、AR、使用者家具擷取、材質、協作、環境分析、VR、施工交接、採購與效能模式。
- 加入 GitHub-ready 的英文、繁體中文與簡體中文 README／CHANGELOG 導覽及語意對等要求。

### 邊界

- 套件是 workflow 與 data-contract layer；可執行 viewer 仍需要相容的 Three.js/Vite 或 React/Three.js runtime。
- 預設輸出是概念性的可編輯模型，不是 BIM、施工／送審圖、實體測量、寫實 digital twin 或購買保證。
- 商品網址與價格是有時間性的證據；Skill 不會結帳、加入購物車、聯絡賣家、提交地址或保證庫存。
- 該版本當時尚未宣告 repository license；未經相容授權不得重新發佈第三方程式碼與資產。

### 驗證

- 使用套件公開驗證腳本驗證 Skill 結構。
- Node 腳本完成 syntax check，並以初始化、概念、正向產品與 strict 阻擋案例測試。
- Canonical Skill 與 Codex／Claude Code 鏡像以檔案 hash 驗證一致。
