// Main thread (Figma sandbox).
// Сканирует документ ИЛИ текущее выделение на используемые шрифты.
// Возвращает в UI кортежи (family, weight, style) — не строки стиля Figma —
// чтобы UI мог автоматически отметить именно нужные начертания в каталоге.

figma.showUI(__html__, { width: 560, height: 740, title: "VOLT · Fonts", themeColors: false });

function classifyStyle(figmaStyle) {
  const lower = String(figmaStyle || "").toLowerCase();
  const italic = lower.includes("italic") || lower.includes("oblique");
  let weight = 400;
  const map = {
    thin: 100, hairline: 100,
    extralight: 200, ultralight: 200,
    light: 300,
    regular: 400, normal: 400, book: 400,
    medium: 500,
    semibold: 600, demibold: 600,
    bold: 700,
    extrabold: 800, ultrabold: 800,
    black: 900, heavy: 900,
    extrablack: 1000
  };
  const stripped = lower.replace(/\s+/g, "");
  for (const k of Object.keys(map)) {
    if (stripped.includes(k)) { weight = map[k]; break; }
  }
  const num = lower.match(/\b(\d{3,4})\b/);
  if (num) weight = +num[1];
  return { weight, style: italic ? "italic" : "normal" };
}

function collectFontsFrom(roots) {
  // family -> Map<weightStyleKey, {weight, style, figmaStyle, count}>
  const used = new Map();

  function add(fontName) {
    if (!fontName || !fontName.family) return;
    if (!used.has(fontName.family)) used.set(fontName.family, new Map());
    const cls = classifyStyle(fontName.style);
    const k = `${cls.weight}__${cls.style}`;
    const bucket = used.get(fontName.family);
    if (!bucket.has(k)) {
      bucket.set(k, { weight: cls.weight, style: cls.style, figmaStyle: fontName.style, count: 0 });
    }
    bucket.get(k).count++;
  }

  function visit(node) {
    if ("fontName" in node) {
      if (node.fontName !== figma.mixed) {
        add(node.fontName);
      } else if ("getRangeFontName" in node && typeof node.characters === "string") {
        const len = node.characters.length;
        let lastKey = null;
        for (let i = 0; i < len; i++) {
          const f = node.getRangeFontName(i, i + 1);
          if (typeof f === "object" && f && f.family) {
            const k = f.family + "__" + f.style;
            if (k !== lastKey) { add(f); lastKey = k; }
          }
        }
      }
    }
    if ("children" in node) for (const c of node.children) visit(c);
  }

  for (const n of roots) visit(n);
  return used;
}

function packFamilies(used, availableSet) {
  const out = [];
  for (const [family, stylesMap] of used.entries()) {
    const usedStyles = [];
    for (const v of stylesMap.values()) {
      usedStyles.push({
        weight: v.weight,
        style: v.style,
        figmaStyle: v.figmaStyle,
        count: v.count,
        available: availableSet.has(`${family}__${v.figmaStyle}`)
      });
    }
    usedStyles.sort((a, b) => a.weight - b.weight || (a.style < b.style ? -1 : 1));
    out.push({ family, usedStyles });
  }
  out.sort((a, b) => a.family.localeCompare(b.family));
  return out;
}

function collectSampleFrom(roots, maxLen) {
  // Берём первые непустые .characters из текстовых узлов в выделении —
  // даём UI настоящий «текст проекта» вместо панграммы по умолчанию.
  const parts = [];
  let total = 0;
  function visit(node) {
    if (total >= maxLen) return;
    if (node.type === "TEXT" && typeof node.characters === "string") {
      const t = node.characters.replace(/\s+/g, " ").trim();
      if (t) {
        const slice = t.length > maxLen - total ? t.slice(0, maxLen - total) : t;
        parts.push(slice);
        total += slice.length + 1;
      }
    }
    if ("children" in node) for (const c of node.children) { if (total >= maxLen) break; visit(c); }
  }
  for (const r of roots) { if (total >= maxLen) break; visit(r); }
  return parts.join(" ").trim();
}

async function scan() {
  const docRoots = figma.root.children; // все страницы
  const selRoots = figma.currentPage.selection;
  const docUsed = collectFontsFrom(docRoots);
  const selUsed = selRoots.length ? collectFontsFrom(selRoots) : null;

  const available = await figma.listAvailableFontsAsync();
  const availableSet = new Set(available.map(a => `${a.fontName.family}__${a.fontName.style}`));

  return {
    document: packFamilies(docUsed, availableSet),
    selection: selUsed ? packFamilies(selUsed, availableSet) : null,
    selectionCount: selRoots.length,
    selectionSample: selRoots.length ? collectSampleFrom(selRoots, 160) : "",
    pageName: figma.currentPage.name
  };
}

const PREFS_KEY = "fonts-plugin-prefs";

figma.ui.onmessage = async (msg) => {
  if (msg.type === "scan") {
    try {
      const result = await scan();
      figma.ui.postMessage({
        type: "scan-result",
        document: result.document,
        selection: result.selection,
        selectionCount: result.selectionCount,
        selectionSample: result.selectionSample,
        pageName: result.pageName
      });
    } catch (e) {
      figma.ui.postMessage({ type: "scan-error", error: String((e && e.message) || e) });
    }
    return;
  }
  if (msg.type === "notify") { figma.notify(msg.text || ""); return; }
  if (msg.type === "close")  { figma.closePlugin(); return; }
  if (msg.type === "open-external") {
    // figma.openExternal валидирует URL и открывает в системном браузере;
    // защищает плагин-sandbox от попыток открыть file:// и прочее.
    try { figma.openExternal(String(msg.url || "")); } catch (e) { /* ignore */ }
    return;
  }
  if (msg.type === "load-prefs") {
    try {
      const prefs = await figma.clientStorage.getAsync(PREFS_KEY);
      figma.ui.postMessage({ type: "prefs-loaded", prefs: prefs || {} });
    } catch (e) {
      figma.ui.postMessage({ type: "prefs-loaded", prefs: {} });
    }
    return;
  }
  if (msg.type === "save-prefs") {
    try { await figma.clientStorage.setAsync(PREFS_KEY, msg.prefs || {}); } catch (e) { /* ignore */ }
    return;
  }
  if (msg.type === "load-fontsource-cache") {
    try {
      const payload = await figma.clientStorage.getAsync("fontsource-cache-v1");
      figma.ui.postMessage({ type: "fontsource-cache", payload: payload || null });
    } catch (e) {
      figma.ui.postMessage({ type: "fontsource-cache", payload: null });
    }
    return;
  }
  if (msg.type === "save-fontsource-cache") {
    // ~1500 шрифтов = ~250 KB — клиентское хранилище справится.
    try { await figma.clientStorage.setAsync("fontsource-cache-v1", msg.payload || null); } catch (e) { /* ignore */ }
    return;
  }
};

// автопересканирование при смене выделения — с debounce 300 мс,
// чтобы не молотить scan на каждое движение мыши при box-select.
let scanDebounce = null;
figma.on("selectionchange", function () {
  if (scanDebounce !== null) clearTimeout(scanDebounce);
  scanDebounce = setTimeout(async function () {
    scanDebounce = null;
    try {
      const result = await scan();
      figma.ui.postMessage({
        type: "scan-result",
        document: result.document,
        selection: result.selection,
        selectionCount: result.selectionCount,
        selectionSample: result.selectionSample,
        pageName: result.pageName
      });
    } catch (e) { /* ignore */ }
  }, 300);
});
