# Interior Design Master｜AI 戶型圖轉互動式 3D 室內設計

[English](README.md) · [繁體中文](README.zh-TW.md) · [简体中文](README.zh-CN.md)<br>
[Changelog](CHANGELOG.md) · [繁體中文](CHANGELOG.zh-TW.md) · [简体中文](CHANGELOG.zh-CN.md)

> 一個可供 Codex 與 Claude Code 使用的可重複 AI Skill：把戶型圖與風格參考圖片轉成可編輯、可在瀏覽器執行的住宅 3D 室內設計 viewer，包含 AI 概念效果圖、真實家具尺寸、購買網址、多種視角與漫遊驗證。

提供一張戶型圖和幾張風格參考圖，這個 Skill 會協助你從最初的視覺方向一路走到可編輯的住宅 3D viewer。流程可以先生成 2–4 個 AI 概念效果圖，再確認建築白模、研究目標市場的真實家具，最後把尺寸、來源證據與購買網址帶進場景。

由於套件是本地且可重複使用的流程層，它可以支援免費或自架的室內設計 3D 建模專案，也適合用來建立戶型圖轉 3D、AI 室內設計房間規劃器或互動式 3D room viewer。

## 快速開始（runtime-starter）

Viewer 已隨 Skill 附上。複製資料夾、安裝相依套件，就能在自己動手寫任何程式碼之前，先在瀏覽器看到一個可執行的 3D 案例。

注意下方的 `cd runtime-starter`：`init-case.mjs` 屬於 Skill 自己的 `scripts/`，在 Skill 根目錄執行；`fetch-assets.mjs`、`link-case.mjs`、`smoke.mjs` 則是 viewer 另一個獨立的 `scripts/`，要在 `runtime-starter/` 目錄下執行。

```text
node scripts/init-case.mjs ./case --name "我的住宅方案"

cd runtime-starter
npm install
node scripts/fetch-assets.mjs
node scripts/link-case.mjs ../../case
npm run dev
npm run build     # smoke 會啟動 dist/，所以要先 build
node scripts/smoke.mjs  # 除非加 --no-build，否則會自動 build
```

- `init-case.mjs` 建立案例資料夾與各項 JSON 契約。
- `fetch-assets.mjs` 下載 CC0 Poly Haven HDRI 與 PBR 貼圖。這是可選步驟；沒有這些檔案時，viewer 會回退到 `RoomEnvironment` 環境光與程序化貼圖。
- `link-case.mjs` 把某個案例的 JSON 複製到 `public/case/`。預設 `public/case/` 已連到 `examples/minimal-case`，那是一個通過 strict 驗證、含一筆真實且已檢查連結的商品資料的案例，所以 `npm run dev` 可以直接運作。
- `smoke.mjs` 是 Playwright 檢查：桌機與手機截圖、console error 檢查、視角切換、代理模型擺放與分享連結來回編碼。

## 畫質分級

Runtime 有三段畫質，且只有一個控制項，選擇記在瀏覽器的 `idm-render-quality`。

| 等級 | 渲染內容 | 預設適用 |
|---|---|---|
| 高 | HDRI 反射、泛光、SMAA、大張陰影貼圖、玻璃透射 | 電腦 |
| 中 | 關閉透射並降低取樣 | 視窗寬度 800px 以下 |
| 低 | 再關閉泛光與抗鋸齒 | 手動選擇 |

`fetch-assets.mjs` 正是讓「高」畫質發揮的關鍵：以真實 HDRI 環境光與地板、牆面、織品 PBR 貼圖取代程序化回退材質。應用程式在有無這些檔案時都能正確渲染，所以下載是畫質升級，不是必要條件。

## 這個 Skill 可以做什麼

Interior Design Master 讓戶型、設計語言、研究後的商品與 3D runtime 保持連貫。生成圖片可以引導設計，但不會被當成幾何證據。

| 能力 | 產出 | 證據邊界 |
|---|---|---|
| AI 概念效果圖橋接 | 當環境提供 Imagen、原生影像生成或其他圖片工具時，在詳細 3D 家具配置前生成 2–4 個視覺方向。 | 概念圖只引導氣氛、材質與構圖，不證明尺寸或商品身分。 |
| 戶型圖轉空間模型 | 將戶型圖圖片、PDF、掃描、SVG 或 CAD 匯出轉成房間、牆體、開口、固定元素、動線、假設與穩定 ID。 | 缺少比例、方位、樓高或開門方向時，會保留為 estimated、inferred 或 unknown。 |
| 白模確認 | 在風格與家具定案前先建立並檢查建築外殼。 | 建築層是獨立且受保護的層。 |
| 可編輯住宅 3D | 套件已內含 Three.js/Vite runtime（`runtime-starter/`），可直接讀取案例 JSON 渲染可替換的設計層；工作區已有相容 runtime 時可自行替換。 | runtime 必須實際執行與檢查；文字規格或建置成功都不等於瀏覽器證據。 |
| 多視角探索 | 在 runtime 支援時提供 orbit、室內／透視、軸測、俯視／2D 平面、房間聚焦、儲存鏡頭與第一人稱漫遊。 | 漫遊、碰撞、手機行為與鏡頭構圖需要實際瀏覽器檢查。 |
| 真實家具研究 | 搜尋目標市場可購買家具，確認精確變體，以毫米記錄尺寸並附上來源證據。 | 先用 live 來源證據確認精確變體，再標記為選定。 |
| 產品連結 3D 配置 | 使用研究後的外部尺寸建立 3D footprint；沒有合法模型時使用有標籤的程序化代理模型。 | 程序化代理模型會與製造商 mesh 分開標示；適配警告與商品尺寸各自保存。 |
| 可購買參考 | 顯示直接購買網址、尺寸來源、查詢日期、價格日期（如有）、適配狀態與未解決檢查。 | 讓連結與查詢情境保留在可追溯的商品資料中。 |
| 審查與交付證據 | 驗證 JSON 契約、build/runtime 行為、渲染畫面、編輯、狀態還原、匯出與商品連結。 | `verified`、`inferred`、`unverified` 與 `blocked` 保持分開。 |

## 為什麼要分階段

風格參考圖很適合決定氣氛與構圖，但不能可靠地確認牆體位置、房間比例、門片開啟方向或真實商品尺寸，因此流程會按這個順序進行：

```text
戶型圖 + 風格參考圖
        ↓
初步空間理解
        ↓
2–4 張 AI 概念效果圖（可選但建議）
        ↓
使用者選定方向
        ↓
白模建築模型
        ↓
風格層 + 即時家具研究
        ↓
可編輯互動式 3D viewer
        ↓
瀏覽器檢查 + 證據收據
```

3D 模型與 `plan.json` 是幾何的 source of truth。選定的概念圖是風格與構圖參考；真實產品頁與規格頁才是商品尺寸及購買網址的來源。

## 真實家具、尺寸與購買網址

當設計包含使用者可能購買的家具時，流程會在把它放進場景前先完成研究。

實際流程會：

1. 確認目標市場、配送國家、語言、幣別與預算情境。
2. 先從戶型與風格推導家具角色及房間限制，例如沙發、床、書桌、餐桌、櫃體、燈具與家電。
3. 使用角色、風格、市場與尺寸條件進行 live 搜尋。
4. 優先使用製造商官網／規格頁，再使用授權零售商，最後才是可信的零售商或 marketplace。
5. 保留精確的型號、尺寸、顏色與變體；不能把 A 變體的尺寸與 B 變體的購買網址拼接。
6. 記錄選中與淘汰候選、搜尋查詢、尺寸證據、直接購買網址、市場、查詢日期、價格日期、幾何來源與適配狀態。
7. 交付前重新開啟產品頁與購買頁，並執行產品連結檢查。

每筆選定的商品資料會包含：

- 穩定的 `productId`；
- 以毫米表示的寬、深、高；
- 與證據網址相同的 `dimensionSourceUrl`；
- 直接 `purchaseUrl`，或明確標示缺少購買網址；
- `fit.status`：`pass`、`warn`、`fail` 或 `unknown`；
- `geometry.source`：provided model、licensed asset、procedural proxy 或 conceptual proxy；
- 尚未確認的動線、配送路徑、門片／抽屜開啟、通風、走線、人體工學與無障礙問題。

零售尺寸可作為物件外部尺寸的基準；門寬、牆體承重，以及建築、消防、無障礙與結構檢查仍需另行確認。

## 安裝與呼叫

### 在 Codex 中呼叫

將 `interior-design-master` 資料夾安裝或複製到 Codex skills 目錄，然後提供戶型圖與風格參考圖，例如：

```text
Use $interior-design-master to turn these floor-plan and style-reference images into 2–4 concept renders first, then build a source-backed interactive residential 3D viewer. Research real furniture in my market, use verified dimensions in the model, and include direct purchase URLs.
```

### 與 Claude Code 一起使用

將資料夾複製到環境設定的 Claude Code skills 目錄，以設定好的 Skill 名稱呼叫，並提供相同的輸入契約。空間資料與 Node 腳本保持平台中立；瀏覽器檢查與影像生成則由 host adapter 處理。

### 初始化案例

從已安裝 Skill 的目錄執行下列指令，或將腳本路徑替換成絕對路徑：

```text
node scripts/init-case.mjs ./case --name "我的住宅方案"
node scripts/image-inventory.mjs ./case/inputs
node scripts/validate-case.mjs ./case --strict
node scripts/check-product-links.mjs ./case
node scripts/test-scripts.mjs
```

`validate-case.mjs --strict` 會完整檢查隨附的各項 schema。`check-product-links.mjs` 會把 `blocked`（403、429、503、網路錯誤）與 `failed`（404 之類）分開回報，只有 `failed` 會讓指令以非零狀態結束；`blocked` 的網址記為 `unverified`，絕不視為通過。`test-scripts.mjs` 是這些腳本自身的離線自我測試，不需要網路。

初始化器會建立：

```text
case/
├─ case.json
├─ plan.json
├─ style.json
├─ concept-renders.json
├─ furniture-products.json
├─ state.json
├─ inputs/
│  ├─ plan/
│  ├─ style/
│  └─ products/
├─ evidence/
└─ output/
```

保留原始輸入與 hash。產品證據及私人備註應放在案例資料夾，不要放入公開 Skill 套件。

## 預期交付物

在選定 runtime 支援的情況下，一個成功案例應包含：

- 可執行、可編輯的 3D viewer；
- 固定建築層與一個以上可替換設計層；
- 包含 prompt 與生成 provenance 的選定概念圖；
- 2D／俯視、透視／orbit、室內與第一人稱視角；
- 家具選取、移動、旋轉、吸附、撤銷／重做與保守碰撞檢查；
- 與場景選中物件連接的產品面板；
- 商品尺寸、證據來源、購買網址、適配警告與代理模型標籤；
- 儲存／還原、分享狀態、PNG 截圖與家具／商品 JSON 或 CSV 匯出；
- 包含輸入／規格 hash、指令、瀏覽器／裝置環境、截圖、失敗與未知項目的驗證收據。

## 架構與資料契約

Skill 將四類資料分開：

1. `plan.json`：幾何、房間、開口、固定元素、動線、比例狀態、假設與未知。
2. `style.json`：色盤、材質、燈光、家具語言與設計規則。
3. `concept-renders.json`：AI 概念方案、prompt、來源輸入角色、provider/model、選擇狀態與輸出路徑。
4. `furniture-products.json`：真實商品身分、尺寸、證據、購買網址、幾何策略與適配狀態。

Runtime 在家具移動、複製、儲存、分享與匯出時，必須保留穩定 ID 與 `productId`。靜態建築可以為效能合併，但可選家具及碰撞資料必須仍可定位。

## 目前範圍與 Roadmap

### 目前 base contract 已包含

- 內建的 Three.js/Vite runtime（`runtime-starter/`）與一個通過 strict 驗證的範例案例；
- 戶型輸入、概念效果圖橋接、白模 gate 與風格交接；
- 包含尺寸與直接購買網址的真實家具研究；
- 產品連結的程序化代理模型與適配警告；
- 多視角 viewer、漫遊、編輯、狀態、截圖、匯出與 QA 契約；
- 證據狀態與 strict 驗證腳本。

### 延後功能

Roadmap 已記錄需要額外工具或證據的功能：

- 自然語言限制式編輯與可撤銷預覽；
- 多套方案視覺差異比較與決策板；
- 預算範圍、商品替代品與多供應商採購；
- RoomPlan／LiDAR／Matterport 掃描匯入與人工校正；
- AR 配置、照片清理與使用者家具擷取；
- 材質／完成面實驗室與更完整的 PBR 資產；
- 協作、留言、版本、360／影片與 WebXR／VR；
- 日照、太陽、風、噪音、微氣候、能源與碳排分析；
- 立面、完成面表、BOM／BOQ 與專業交接；
- LOD、GPU 能力偵測、漸進載入與離線模式。

啟用延後模組前請閱讀 [功能 Roadmap](references/feature-roadmap.md)。Roadmap 項目不代表已實作。

## 範圍

Interior Design Master 產出的是概念性、可編輯的住宅 3D viewer。施工圖、BIM／MEP／結構審查、實體測量、digital twin 準確度、專業法規審查與購買交易，不在這個套件的範圍內。

## 常見問題

### 這是免費室內設計 3D 建模工具嗎？

它是本地的 Skill、runtime 與驗證套件，不是代管式工具。它可以支援免費或自架專案；影像模型、瀏覽器、產品研究與 hosting 由各專案自行選擇。Repository 的原始內容採 MIT 授權，外部服務與資產仍受各自條款約束。

### 它可以把戶型圖轉成 3D 模型嗎？

可以。`runtime-starter/` 會讀取案例 JSON 並渲染，不必先另外找一個 runtime。Skill 會先記錄房間、牆體、開口、比例狀態與假設，再建立白模並配置家具。沒有比例或存在歧義的戶型會保留為暫定資料。

### 它會在 3D viewer 前先生成寫實室內效果圖嗎？

當 Imagen、Codex 原生影像生成或其他 host 圖片工具可用時會。Skill 會先生成少量概念方案，保存 prompt 與 provenance，再把選定的風格方向交給 3D 流程；概念圖不會被當成幾何證據。

### 它使用真實家具嗎？

會。可購買家具必須從目標市場的 live 來源研究、綁定精確變體、由來源頁取得尺寸，並連到直接購買網址。沒有合法 3D 模型時，viewer 會使用尺寸正確的程序化代理模型並明確標示。

### 我可以在設計裡走動嗎？

Runtime 契約包含第一人稱漫遊、鏡頭預設、orbit、俯視／2D 平面、房間聚焦、碰撞與支援時的手機控制。要宣稱這些行為 verified，仍需實際瀏覽器與裝置檢查。

### Codex 與 Claude Code 可以使用同一個 Skill 嗎？

可以。資料契約與 Node validator 是可攜的。Codex 與 Claude Code 可以使用不同的影像、瀏覽器、檔案系統或 hosting adapter，但不能因此改變證據或幾何契約。

### 它可以產出施工圖嗎？

預設不能。它產出的是概念性、可編輯的 3D 設計。施工交接屬於延後模組，需要有尺寸的已審查來源資料與合格專業人員驗證。

## 研究基礎

這套流程參考目前室內設計與空間規劃工具的能力，包括 [Planner 5D](https://support.planner5d.com/en/articles/14434484-how-to-upload-a-floor-plan) 的戶型圖轉可編輯 3D 與 360 漫遊、[Coohom](https://www.coohom.com/all-in-one-software) 的家具目錄／預算／360 流程、[IKEA Kreativ](https://www.ikea.com/us/en/customer-service/knowledge/articles/43460e1e-dd01-4fe8-86ac-74efecd7743f.html) 的掃描／移除／放置／購物流程、[Apple RoomPlan](https://developer.apple.com/augmented-reality/roomplan/) 的參數化 LiDAR 房間掃描、[Matterport](https://matterport.com/matterport-academy/intro-to-editing-tools/take-custom-measurements) 的空間測量與導覽，以及 [Autodesk Forma](https://www.autodesk.com/products/forma/environmental-impact-analysis) 的環境分析。這些是能力參考，不是本 Skill 的必要依賴或保證。

## 建議 GitHub Topics

只使用確實描述 repository 的 topics：

`ai-interior-design` · `3d-interior-design` · `free-interior-design` · `floor-plan-to-3d` · `3d-room-planner` · `room-planner` · `threejs` · `claude-code` · `codex-skill` · `furniture-research` · `procedural-3d` · `interactive-3d-viewer`

## 貢獻方式

有價值的貢獻應改善真實任務，或讓契約更容易使用。請讓變更符合 plan／style／product／state 契約，維持三語版本在能力、產出、限制與連結上的一致。盡可能加入聚焦驗證，並把實驗標示為 experimental 或 unverified。不要加入私人戶型圖、地址、憑證、零售商帳戶或沒有授權的商品資產。

提交 Pull Request 前，請執行：

```text
node scripts/test-scripts.mjs
node scripts/validate-case.mjs <case-dir> --strict

cd runtime-starter
npm install
npm run build
node scripts/smoke.mjs
```

並記錄實際的瀏覽器／裝置檢查與剩餘未知項目。靜態 validator 通過不等於 3D viewer 已在瀏覽器正常運作。

## 相關檔案

- [Skill 指令](SKILL.md)
- [內建 runtime](runtime-starter/README.md)
- [最小範例案例](examples/minimal-case)
- [輸入契約](references/input-contract.md)
- [概念效果圖契約](references/concept-render-contract.md)
- [產品研究與 provenance](references/product-research-and-provenance.md)
- [Runtime adapter](references/runtime-adapter.md)
- [驗證與交付](references/validation-and-delivery.md)
- [延後功能 Roadmap](references/feature-roadmap.md)
- [參考實作說明](references/github-distillation.md)
- [Changelog](CHANGELOG.md)

## License

這個 repository 的原始內容採用 [MIT License](LICENSE)。MIT 授權不延伸至第三方相依套件、商品照片、mesh、材質、目錄資料或其他外部資產；來源連結不代表取得這些材料的複製權。
