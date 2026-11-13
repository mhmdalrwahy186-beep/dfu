# Interior Design Master｜AI 户型图转交互式 3D 室内设计

[English](README.md) · [繁體中文](README.zh-TW.md) · [简体中文](README.zh-CN.md)<br>
[Changelog](CHANGELOG.md) · [繁體中文](CHANGELOG.zh-TW.md) · [简体中文](CHANGELOG.zh-CN.md)

> 一个可供 Codex 与 Claude Code 使用的可复用 AI Skill：把户型图与风格参考图片转成可编辑、可在浏览器运行的住宅 3D 室内设计 viewer，包含 AI 概念效果图、真实家具尺寸、购买网址、多种视角与漫游验证。

提供一张户型图和几张风格参考图，这个 Skill 会帮助你从最初的视觉方向一路走到可编辑的住宅 3D viewer。流程可以先生成 2–4 个 AI 概念效果图，再确认建筑白模、研究目标市场的真实家具，最后把尺寸、来源证据与购买网址带进场景。

由于套件是本地且可复用的流程层，它可以支持免费或自托管的室内设计 3D 建模项目，也适合用来建立户型图转 3D、AI 室内设计房间规划器或交互式 3D room viewer。

## 快速开始（runtime-starter）

Viewer 已随 Skill 附上。复制文件夹、安装依赖，就能在自己动手写任何代码之前，先在浏览器看到一个可运行的 3D 案例。

注意下方的 `cd runtime-starter`：`init-case.mjs` 属于 Skill 自己的 `scripts/`，在 Skill 根目录执行；`fetch-assets.mjs`、`link-case.mjs`、`smoke.mjs` 则是 viewer 另一个独立的 `scripts/`，要在 `runtime-starter/` 目录下执行。

```text
node scripts/init-case.mjs ./case --name "我的住宅方案"

cd runtime-starter
npm install
node scripts/fetch-assets.mjs
node scripts/link-case.mjs ../../case
npm run dev
npm run build     # smoke 会启动 dist/，所以要先 build
node scripts/smoke.mjs  # 除非加 --no-build，否则会自动 build
```

- `init-case.mjs` 建立案例文件夹与各项 JSON 契约。
- `fetch-assets.mjs` 下载 CC0 Poly Haven HDRI 与 PBR 贴图。这是可选步骤；没有这些文件时，viewer 会回退到 `RoomEnvironment` 环境光与程序化贴图。
- `link-case.mjs` 把某个案例的 JSON 复制到 `public/case/`。默认 `public/case/` 已连到 `examples/minimal-case`，那是一个通过 strict 验证、含一条真实且已检查链接的商品记录的案例，所以 `npm run dev` 可以直接运行。
- `smoke.mjs` 是 Playwright 检查：桌面与手机截图、console error 检查、视角切换、代理模型摆放与分享链接往返编码。

## 画质分级

Runtime 有三档画质，且只有一个控制项，选择记在浏览器的 `idm-render-quality`。

| 等级 | 渲染内容 | 默认适用 |
|---|---|---|
| 高 | HDRI 反射、泛光、SMAA、大张阴影贴图、玻璃透射 | 电脑 |
| 中 | 关闭透射并降低采样 | 视窗宽度 800px 以下 |
| 低 | 再关闭泛光与抗锯齿 | 手动选择 |

`fetch-assets.mjs` 正是让「高」画质发挥的关键：以真实 HDRI 环境光与地板、墙面、织品 PBR 贴图取代程序化回退材质。应用程序在有无这些文件时都能正确渲染，所以下载是画质升级，不是必要条件。

## 这个 Skill 可以做什么

Interior Design Master 让户型、设计语言、研究后的商品与 3D runtime 保持连贯。生成图片可以引导设计，但不会被当作几何证据。

| 能力 | 产出 | 证据边界 |
|---|---|---|
| AI 概念效果图桥接 | 当环境提供 Imagen、原生图像生成或其他图片工具时，在详细 3D 家具配置前生成 2–4 个视觉方向。 | 概念图只引导氛围、材质与构图，不证明尺寸或商品身份。 |
| 户型图转空间模型 | 将户型图图片、PDF、扫描、SVG 或 CAD 导出转成房间、墙体、开口、固定元素、动线、假设与稳定 ID。 | 缺少比例、方位、层高或开门方向时，会保留为 estimated、inferred 或 unknown。 |
| 白模确认 | 在风格与家具定案前先建立并检查建筑外壳。 | 建筑层是独立且受保护的层。 |
| 可编辑住宅 3D | 套件已内含 Three.js/Vite runtime（`runtime-starter/`），可直接读取案例 JSON 渲染可替换的设计层；工作区已有兼容 runtime 时可自行替换。 | runtime 必须实际运行与检查；文字规格或构建成功都不等于浏览器证据。 |
| 多视角探索 | 在 runtime 支持时提供 orbit、室内／透视、轴测、俯视／2D 平面、房间聚焦、保存镜头与第一人称漫游。 | 漫游、碰撞、手机行为与镜头构图需要实际浏览器检查。 |
| 真实家具研究 | 搜索目标市场可购买家具，确认精确变体，以毫米记录尺寸并附上来源证据。 | 先用 live 来源证据确认精确变体，再标记为选定。 |
| 产品链接 3D 配置 | 使用研究后的外部尺寸建立 3D footprint；没有合法模型时使用有标签的程序化代理模型。 | 程序化代理模型会与制造商 mesh 分开标示；适配警告与商品尺寸分别保存。 |
| 可购买参考 | 显示直接购买网址、尺寸来源、查询日期、价格日期（如有）、适配状态与未解决检查。 | 让链接与查询情境保留在可追溯的商品资料中。 |
| 审查与交付证据 | 验证 JSON 契约、build/runtime 行为、渲染画面、编辑、状态还原、导出与商品链接。 | `verified`、`inferred`、`unverified` 与 `blocked` 保持分开。 |

## 为什么要分阶段

风格参考图很适合决定氛围与构图，但不能可靠地确认墙体位置、房间比例、门片开启方向或真实商品尺寸，因此流程会按这个顺序进行：

```text
户型图 + 风格参考图
        ↓
初步空间理解
        ↓
2–4 张 AI 概念效果图（可选但建议）
        ↓
用户选定方向
        ↓
白模建筑模型
        ↓
风格层 + 实时家具研究
        ↓
可编辑交互式 3D viewer
        ↓
浏览器检查 + 证据收据
```

3D 模型与 `plan.json` 是几何的 source of truth。选定的概念图是风格与构图参考；真实产品页与规格页才是商品尺寸及购买网址的来源。

## 真实家具、尺寸与购买网址

当设计包含用户可能购买的家具时，流程会在把它放进场景前先完成研究。

实际流程会：

1. 确认目标市场、配送国家、语言、货币与预算情境。
2. 先从户型与风格推导家具角色及房间限制，例如沙发、床、书桌、餐桌、柜体、灯具与家电。
3. 使用角色、风格、市场与尺寸条件进行 live 搜索。
4. 优先使用制造商官网／规格页，再使用授权零售商，最后才是可信的零售商或 marketplace。
5. 保留精确的型号、尺寸、颜色与变体；不能把 A 变体的尺寸与 B 变体的购买网址拼接。
6. 记录选中与淘汰候选、搜索查询、尺寸证据、直接购买网址、市场、查询日期、价格日期、几何来源与适配状态。
7. 交付前重新打开产品页与购买页，并执行产品链接检查。

每个选定的商品资料会包含：

- 稳定的 `productId`；
- 以毫米表示的宽、深、高；
- 与证据网址相同的 `dimensionSourceUrl`；
- 直接 `purchaseUrl`，或明确标示缺少购买网址；
- `fit.status`：`pass`、`warn`、`fail` 或 `unknown`；
- `geometry.source`：provided model、licensed asset、procedural proxy 或 conceptual proxy；
- 尚未确认的动线、配送路径、门片／抽屉开启、通风、走线、人体工学与无障碍问题。

零售尺寸可作为物件外部尺寸的基准；门宽、墙体承重，以及建筑、消防、无障碍与结构检查仍需另行确认。

## 安装与调用

### 在 Codex 中调用

将 `interior-design-master` 文件夹安装或复制到 Codex skills 目录，然后提供户型图与风格参考图，例如：

```text
Use $interior-design-master to turn these floor-plan and style-reference images into 2–4 concept renders first, then build a source-backed interactive residential 3D viewer. Research real furniture in my market, use verified dimensions in the model, and include direct purchase URLs.
```

### 与 Claude Code 一起使用

将文件夹复制到环境配置的 Claude Code skills 目录，以设置好的 Skill 名称调用，并提供相同的输入契约。空间数据与 Node 脚本保持平台中立；浏览器检查与图像生成则由 host adapter 处理。

### 初始化案例

从已安装 Skill 的目录执行下列指令，或将脚本路径替换成绝对路径：

```text
node scripts/init-case.mjs ./case --name "我的住宅方案"
node scripts/image-inventory.mjs ./case/inputs
node scripts/validate-case.mjs ./case --strict
node scripts/check-product-links.mjs ./case
node scripts/test-scripts.mjs
```

`validate-case.mjs --strict` 会完整检查随附的各项 schema。`check-product-links.mjs` 会把 `blocked`（403、429、503、网络错误）与 `failed`（404 之类）分开报告，只有 `failed` 会让命令以非零状态结束；`blocked` 的网址记为 `unverified`，绝不视为通过。`test-scripts.mjs` 是这些脚本自身的离线自测，不需要网络。

初始化器会建立：

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

保留原始输入与 hash。产品证据及私人备注应放在案例文件夹，不要放入公开 Skill 套件。

## 预期交付物

在选定 runtime 支持的情况下，一个成功案例应包含：

- 可执行、可编辑的 3D viewer；
- 固定建筑层与一个以上可替换设计层；
- 包含 prompt 与生成 provenance 的选定概念图；
- 2D／俯视、透视／orbit、室内与第一人称视角；
- 家具选择、移动、旋转、吸附、撤销／重做与保守碰撞检查；
- 与场景选中物件连接的产品面板；
- 商品尺寸、证据来源、购买网址、适配警告与代理模型标签；
- 保存／还原、分享状态、PNG 截图与家具／商品 JSON 或 CSV 导出；
- 包含输入／规格 hash、指令、浏览器／设备环境、截图、失败与未知项目的验证收据。

## 架构与数据契约

Skill 将四类数据分开：

1. `plan.json`：几何、房间、开口、固定元素、动线、比例状态、假设与未知。
2. `style.json`：色盘、材质、灯光、家具语言与设计规则。
3. `concept-renders.json`：AI 概念方案、prompt、来源输入角色、provider/model、选择状态与输出路径。
4. `furniture-products.json`：真实商品身份、尺寸、证据、购买网址、几何策略与适配状态。

Runtime 在家具移动、复制、保存、分享与导出时，必须保留稳定 ID 与 `productId`。静态建筑可以为了性能合并，但可选家具及碰撞数据必须仍可定位。

## 当前范围与 Roadmap

### 当前 base contract 已包含

- 内建的 Three.js/Vite runtime（`runtime-starter/`）与一个通过 strict 验证的示例案例；
- 户型输入、概念效果图桥接、白模 gate 与风格交接；
- 包含尺寸与直接购买网址的真实家具研究；
- 产品链接的程序化代理模型与适配警告；
- 多视角 viewer、漫游、编辑、状态、截图、导出与 QA 契约；
- 证据状态与 strict 验证脚本。

### 延后功能

Roadmap 已记录需要额外工具或证据的功能：

- 自然语言限制式编辑与可撤销预览；
- 多套方案视觉差异比较与决策板；
- 预算范围、商品替代品与多供应商采购；
- RoomPlan／LiDAR／Matterport 扫描导入与人工校正；
- AR 配置、照片清理与用户家具采集；
- 材质／完成面实验室与更完整的 PBR 资产；
- 协作、留言、版本、360／视频与 WebXR／VR；
- 日照、太阳、风、噪音、微气候、能源与碳排分析；
- 立面、完成面表、BOM／BOQ 与专业交接；
- LOD、GPU 能力检测、渐进加载与离线模式。

启用延后模块前请阅读 [功能 Roadmap](references/feature-roadmap.md)。Roadmap 项目不代表已实现。

## 范围

Interior Design Master 产出的是概念性、可编辑的住宅 3D viewer。施工图、BIM／MEP／结构审查、实体测量、digital twin 准确度、专业法规审查与购买交易，不在这个套件的范围内。

## 常见问题

### 这是免费室内设计 3D 建模工具吗？

它是本地的 Skill、runtime 与验证套件，不是托管式工具。它可以支持免费或自托管项目；图像模型、浏览器、产品研究与 hosting 由各项目自行选择。Repository 的原始内容采用 MIT 授权，外部服务与资产仍受各自条款约束。

### 它可以把户型图转成 3D 模型吗？

可以。`runtime-starter/` 会读取案例 JSON 并渲染，不必先另外找一个 runtime。Skill 会先记录房间、墙体、开口、比例状态与假设，再建立白模并配置家具。没有比例或存在歧义的户型会保留为暂定数据。

### 它会在 3D viewer 前先生成写实室内效果图吗？

当 Imagen、Codex 原生图像生成或其他 host 图片工具可用时会。Skill 会先生成少量概念方案，保存 prompt 与 provenance，再把选定的风格方向交给 3D 流程；概念图不会被当作几何证据。

### 它使用真实家具吗？

会。可购买家具必须从目标市场的 live 来源研究、绑定精确变体、由来源页取得尺寸，并连接到直接购买网址。没有合法 3D 模型时，viewer 会使用尺寸正确的程序化代理模型并明确标示。

### 我可以在设计里走动吗？

Runtime 契约包含第一人称漫游、镜头预设、orbit、俯视／2D 平面、房间聚焦、碰撞与支持时的手机控制。要宣称这些行为 verified，仍需实际浏览器与设备检查。

### Codex 与 Claude Code 可以使用同一个 Skill 吗？

可以。数据契约与 Node validator 是可移植的。Codex 与 Claude Code 可以使用不同的图像、浏览器、文件系统或 hosting adapter，但不能因此改变证据或几何契约。

### 它可以产出施工图吗？

默认不能。它产出的是概念性、可编辑的 3D 设计。施工交接属于延后模块，需要有尺寸的已审查来源数据与合格专业人员验证。

## 研究基础

这套流程参考当前室内设计与空间规划工具的能力，包括 [Planner 5D](https://support.planner5d.com/en/articles/14434484-how-to-upload-a-floor-plan) 的户型图转可编辑 3D 与 360 漫游、[Coohom](https://www.coohom.com/all-in-one-software) 的家具目录／预算／360 流程、[IKEA Kreativ](https://www.ikea.com/us/en/customer-service/knowledge/articles/43460e1e-dd01-4fe8-86ac-74efecd7743f.html) 的扫描／移除／放置／购物流程、[Apple RoomPlan](https://developer.apple.com/augmented-reality/roomplan/) 的参数化 LiDAR 房间扫描、[Matterport](https://matterport.com/matterport-academy/intro-to-editing-tools/take-custom-measurements) 的空间测量与导览，以及 [Autodesk Forma](https://www.autodesk.com/products/forma/environmental-impact-analysis) 的环境分析。这些是能力参考，不是本 Skill 的必要依赖或保证。

## 建议 GitHub Topics

只使用确实描述 repository 的 topics：

`ai-interior-design` · `3d-interior-design` · `free-interior-design` · `floor-plan-to-3d` · `3d-room-planner` · `room-planner` · `threejs` · `claude-code` · `codex-skill` · `furniture-research` · `procedural-3d` · `interactive-3d-viewer`

## 贡献方式

有价值的贡献应改善真实任务，或让契约更容易使用。请让变更符合 plan／style／product／state 契约，保持三语版本在能力、产出、限制与链接上的一致。尽可能加入聚焦验证，并把实验标示为 experimental 或 unverified。不要加入私人户型图、地址、凭证、零售商账户或没有授权的商品资产。

提交 Pull Request 前，请执行：

```text
node scripts/test-scripts.mjs
node scripts/validate-case.mjs <case-dir> --strict

cd runtime-starter
npm install
npm run build
node scripts/smoke.mjs
```

并记录实际的浏览器／设备检查与剩余未知项目。静态 validator 通过不等于 3D viewer 已在浏览器正常运行。

## 相关文件

- [Skill 指令](SKILL.md)
- [内建 runtime](runtime-starter/README.md)
- [最小示例案例](examples/minimal-case)
- [输入契约](references/input-contract.md)
- [概念效果图契约](references/concept-render-contract.md)
- [产品研究与 provenance](references/product-research-and-provenance.md)
- [Runtime adapter](references/runtime-adapter.md)
- [验证与交付](references/validation-and-delivery.md)
- [延后功能 Roadmap](references/feature-roadmap.md)
- [参考实现说明](references/github-distillation.md)
- [Changelog](CHANGELOG.md)

## License

这个 repository 的原始内容采用 [MIT License](LICENSE)。MIT 授权不延伸至第三方依赖、商品照片、mesh、材质、目录数据或其他外部资产；来源链接不代表取得这些材料的复制权。
