# Changelog｜简体中文

[English](CHANGELOG.md) · [繁體中文](CHANGELOG.zh-TW.md) · [简体中文](CHANGELOG.zh-CN.md)<br>
[README](README.md) · [繁體中文](README.zh-TW.md) · [简体中文](README.zh-CN.md)

Interior Design Master 的重要变更会记录在这里。版本号描述 Skill 套件与数据契约，不代表每一个兼容的 3D runtime 都已实现所有可选功能。

## [0.2.3] — 2026-09-11

### 变更

- 为 repository 的原始内容加入 MIT License。
- 审核公开 README，移除 host-local validator 指令，保留公开的 Node、build 与浏览器检查。
- 将 reference implementation notes 改写为公开 provenance 说明，移除私有项目语境。

### 已验证

- README 本地链接均可解析，文档中的检查可从 repository root 执行。
- `node scripts/test-scripts.mjs` 与 `examples/minimal-case` 的 strict 验证通过。
- `runtime-starter` 执行 `npm run build` 成功。

## [0.2.1] — 2026-09-10

由一次 clean-room 测试发现的五个问题（一个由图片撰写、strict 验证通过、带有 IKEA 台湾沙发产品的真实一房+彈性房户型）。

### 修复

- `placeProduct(productId)` 在不带坐标调用时，会使用整个平面图的外接框中心，在真实户型里往往落在墙上或很窄的房间里。现在会先解析出目标房间——由当前 `style.json` 的 `furnitureRoles[]` 中与该产品角色匹配的条目指定的房间，否则取最大的室内非湿区房间（与 inside/walk 相机原本使用的规则相同）——再以该房间多边形的重心为落点。由于一件又长又窄的家具若以旋转角 0 落入 x 轴比 z 轴窄的房间，无论探测点如何偏移都不可能通过既有的螺旋重叠搜索，默认路径现在会先让家具以「长边对齐房间长边」的方向落地，再交给该螺旋搜索处理，搜索本身未改动。`runtime-starter/scripts/smoke.mjs` 的 "places a product proxy" 检查现在会走这条默认路径（不带显式坐标），并在细节中回报所选房间与来源（`style-role`、`largest-indoor-room` 或 `bbox-fallback`）。
- 当 `public/textures` 与 `public/hdri` 为空（尚未执行 `fetch-assets.mjs` 的全新拷贝）时，页面会抛出 `pageerror: Cannot read properties of undefined (reading 'image')`。根因：Vite 开发/预览服务器对缺失的静态资源会以 200 加 SPA 回退的 `index.html` 响应，而不是 404；three.js 的 `HDRLoader`/`DataTextureLoader` 在把这段 HTML 当作 HDR 文件解析时会抛错，且其自身的 `catch` 分支调用 `onError` 后仍会继续往下用那个从未赋值的解析结果，抛出未捕获的错误。`runtime-starter/src/render.js` 现在会先检查响应开头字节是否为真正的 RADIANCE/RGBE 魔数（`#?`），再决定要不要交给 `HDRLoader`，这条坏路径因此完全不会被触发；`RoomEnvironment` 加程序化画布贴图的后备方案在两种情况下都能零页面错误地撑起场景。已验证资源缺失与资源齐全两种状态下均为 17/17。
- `SKILL.md` 的 "Start from runtime-starter" 区块、`references/runtime-adapter.md`，以及三份 README 的快速开始，现在都明确说明并用 `cd` 展示：`fetch-assets.mjs`、`link-case.mjs`、`smoke.mjs` 要在复制出来的 `runtime-starter`/viewer 目录里执行；`init-case.mjs`、`validate-case.mjs`、`check-product-links.mjs`、`image-inventory.mjs`、`test-scripts.mjs` 则是 Skill 自己另一份 `scripts/`，在 Skill 根目录执行。
- `references/input-contract.md` "Image and drawing handling" 第 5 点新增一个从无比例尺的营销户型图中的双人床（并简述标准门扇）推导 `metresPerPixel` 的实作范例，对应的 `plan.json.source`（`scaleStatus: "estimated"`、`metresPerPixel`）与带 `basis` 的 `assumptions[]` 条目写法，并说明内建的 `examples/minimal-case` 是一份 `scaleStatus: "confirmed"` 的已授权户型图，不会走到这条估算路径。
- `scripts/image-inventory.mjs` 原本只解析 PNG 与 JPEG 的尺寸。现在也会解析 WebP（VP8、VP8L、VP8X 三种表头）与 GIF；对未解析的格式（avif、svg、pdf、bmp）会明确回报 `"dimensions": null` 并附上 `"dimensionsNote": "not probed for this format"`，不再是无声的 `null`。`references/input-contract.md` 第 1 点说明了哪些格式会被探测尺寸。`scripts/test-scripts.mjs` 新增一个 WebP 测试样例（一段生成的最小 VP8L 表头），断言解析出的宽高。

### 已验证

- 针对 clean-room 案例（资源缺失）执行 `node runtime-starter/scripts/smoke.mjs`：17 通过、0 失败，控制台/页面均无错误，默认落点通过 `style-role` 把沙发放进了 `rm-living`。
- 针对 `examples/minimal-case`（资源齐全，真实 HDRI 已加载）执行 `node runtime-starter/scripts/smoke.mjs`：17 通过、0 失败。
- `node scripts/test-scripts.mjs`：全部通过，含新增的 WebP 测试断言。
- `node scripts/validate-case.mjs examples/minimal-case --strict`：`valid: true`。

## [0.2.0] — 2026-09-10

### 新增

- 加入 `runtime-starter/`：以案例 JSON 契约驱动的 Vite 与 Three.js viewer，让复制 Skill 文件夹的人不必先自行建立 runtime，就能得到可运行、可编辑的住宅 3D viewer。
- 加入 `examples/minimal-case`：通过 strict 验证、含一条真实且已检查链接的商品记录的案例，并预先连到 starter 的 `public/case/`。
- 加入 `runtime-starter/scripts/fetch-assets.mjs`，可选下载 CC0 Poly Haven HDRI 与 PBR 贴图；没有这些文件时回退到 `RoomEnvironment` 与程序化贴图。
- 加入 `runtime-starter/scripts/link-case.mjs`，把案例的 JSON 复制到运行中的 viewer。
- 加入 `runtime-starter/scripts/smoke.mjs`：Playwright 检查，涵盖桌面与手机截图、console error、视角切换、代理模型摆放与分享链接往返编码。
- 加入 `scripts/test-scripts.mjs`：Skill 自身脚本的离线自测。
- 加入高／中／低三档画质，只保留一个控制项，宽度 800px 以下默认为中，选择记在 `idm-render-quality`。

### 变更

- 将 SKILL.md frontmatter 的 description 改写为只描述触发条件的第三人称句子，包含中英文触发词，且不摘要工作流程。
- 精简 SKILL.md 正文，只保留 gate 清单、runtime-starter 起手路径、状态与证据命令、诚实边界、红旗清单与续作规则。产品研究与 runtime 细节改由原本就涵盖这些内容的 reference 承接。
- 让 `validate-case.mjs` 与随附 schema 对齐，`--strict` 会完整检查。
- `check-product-links.mjs` 改为把 `blocked`（403、429、503、网络错误）与 `failed`（404 之类）分开报告，只有 `failed` 会以非零状态结束；`blocked` 记为 `unverified`，不视为通过。
- 重写 `references/runtime-adapter.md`，以 runtime-starter 为默认 runtime，含模块对照表、API 接口、画质分级契约、替换现有 runtime 的做法，以及从参考项目验证记录蒸馏出的可通用经验。
- 更新 `references/validation-and-delivery.md`：加入 smoke 步骤、离线自测，以及 blocked 与 failed 的区别。
- 让概念效果图阶段在 Claude Code 上有具体做法：使用可用的图像生成 MCP server、skill 或已配置的 API；都没有时将该阶段记为 skipped。
- 更新三份 README：加入快速开始、画质分级，以及「已内含 runtime」的能力条目。0.1.0 中「仍需要外部兼容 runtime」的边界不再适用。

### 验证

- `node scripts/test-scripts.mjs`：23 项离线断言全部通过，exit 0。
- `node scripts/validate-case.mjs examples/minimal-case --strict`：验证通过，0 个错误、0 个警告（6 个房间、2 种风格、1 项商品）。
- `node scripts/check-product-links.mjs examples/minimal-case`：检查 1 个网址，HTTP 200，0 个失败、0 个 blocked。示例商品：IKEA EKTORP 三人座沙发（Hakebo 深灰），官方 GB 页面，尺寸于 2026-09-10 从页面读取。
- runtime-starter：`npm install` 与 `npm run build` 成功（three r183、Vite 7）。`node scripts/fetch-assets.mjs` 下载 27 个 CC0 Poly Haven 文件，sha256 均验证通过。
- `node scripts/smoke.mjs`（Playwright Chromium、SwiftShader、vite preview）：17 项通过、0 项失败；桌面 1440×900 与手机 390×844 截图；两者 console error 均为零；HDRI 环境生效中；视角预设切换、商品代理模型摆放并保留 productId、focusItem、分享链接哈希（share-hash）往返编解码、低／中／高画质分级与持久化、手机默认中画质、exportProducts 携带证据、漫游碰撞，均已验证。
- 未验证：真机 GPU 表现（手机测试为软件渲染下的模拟视口）、iOS 伪全屏（fake-fullscreen）回退、通过 geometry.assetPath 加载 GLB（代码路径存在，但没有示例提供模型）、分享链接的剪贴板复制（编解码已由往返测试覆盖）。

## [0.1.0] — 2026-09-09

### 新增

- 创建可供 Codex 与 Claude Code 使用的 `interior-design-master` reusable Skill。
- 创建从户型图输入、空间规格、白模审查、风格层、产品研究、交互 3D 集成到浏览器 QA 的分阶段流程。
- 加入详细 3D 家具配置前先生成 2–4 个 AI 概念方案的 concept-render bridge；前提是 host 提供图像生成工具。
- 加入 `concept-renders.json`、Schema、provenance 要求、选中／淘汰状态，以及概念图不能建立几何或产品事实的规则。
- 加入 plan、style、furniture-product 与 case-state Schema，使用稳定 ID 并明确区分 confirmed／estimated／inferred／unknown。
- 对可购买推荐加入 live 家具研究要求：精确变体、毫米尺寸、来源证据、直接购买网址、市场／日期情境、几何策略与适配状态。
- 加入 `init-case.mjs`、`image-inventory.mjs`、`validate-case.mjs` 与 `check-product-links.mjs`。
- 加入 orbit、透视、轴测、俯视／2D 平面、第一人称漫游、碰撞、编辑历史、吸附、保存／分享、截图、导出与产品面板的 runtime 指引。
- 从参考住宅空间设计项目蒸馏可复用模式，但不复制其示例坐标、私人输入、模型资产、部署数据或验证收据。
- 加入研究导向的 roadmap：自然语言编辑、方案比较、预算、扫描导入、AR、用户家具采集、材质、协作、环境分析、VR、施工交接、采购与性能模式。
- 加入 GitHub-ready 的英文、繁体中文与简体中文 README／CHANGELOG 导航及语义对等要求。

### 边界

- 套件是 workflow 与 data-contract layer；可运行 viewer 仍需要兼容的 Three.js/Vite 或 React/Three.js runtime。
- 默认输出是概念性的可编辑模型，不是 BIM、施工／送审图、实体测量、写实 digital twin 或购买保证。
- 商品网址与价格是有时效性的证据；Skill 不会结账、加入购物车、联系卖家、提交地址或保证库存。
- 该版本当时尚未声明 repository license；未经兼容授权不得重新发布第三方代码与资产。

### 验证

- 使用套件公开验证脚本验证 Skill 结构。
- Node 脚本完成 syntax check，并以初始化、概念、正向产品与 strict 阻挡案例测试。
- Canonical Skill 与 Codex／Claude Code 镜像以文件 hash 验证一致。
