// アプリのアイコン（icon-192.png・icon-512.png）を作る。生成りの地に、物差しの目盛りと「km」、朱の印。
// icon-maskable-512.png は Android の丸い切り抜き用：絵を中心の半径40％の円（必ず見える所）に収める。
// 使い方: node tools/make-icons.cjs（qa/ の playwright を使う）
const path = require("path");
const { chromium } = require(path.join(__dirname, "..", "qa", "node_modules", "playwright"));
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  for (const [s, mask] of [[192, false], [512, false], [512, true]]) {
    const p = await b.newPage({ viewport: { width: s, height: s } });
    await p.setContent(`<body style="margin:0"><svg width="${s}" height="${s}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#f4f1e8"/><g transform="${mask ? "translate(22 22) scale(0.56)" : ""}">
      <rect x="16" y="18" width="68" height="68" rx="8" fill="#fff" stroke="#1f2a44" stroke-width="3"/>
      <rect x="16" y="18" width="68" height="18" rx="8" fill="#b8402a"/><rect x="16" y="28" width="68" height="8" fill="#b8402a"/>
      <circle cx="34" cy="18" r="4" fill="#1f2a44"/><circle cx="66" cy="18" r="4" fill="#1f2a44"/>
      <text x="50" y="76" font-size="38" font-weight="900" text-anchor="middle" fill="#142a52" font-family="'Noto Sans CJK JP',sans-serif">和</text></g></svg></body>`);
    await p.screenshot({ path: path.join(__dirname, "..", mask ? "icon-maskable-512.png" : `icon-${s}.png`), clip: { x: 0, y: 0, width: s, height: s } });
  }
  await b.close();
})();
