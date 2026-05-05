// Main thread (Figma sandbox).
// Сканирует документ ИЛИ текущее выделение на используемые шрифты.
// Возвращает в UI кортежи (family, weight, style) — не строки стиля Figma —
// чтобы UI мог автоматически отметить именно нужные начертания в каталоге.

figma.showUI(__html__, { width: 540, height: 700, themeColors: true });

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
    pageName: figma.currentPage.name
  };
}

figma.ui.onmessage = async (msg) => {
  if (msg.type === "scan") {
    try {
      const result = await scan();
      figma.ui.postMessage({
        type: "scan-result",
        document: result.document,
        selection: result.selection,
        selectionCount: result.selectionCount,
        pageName: result.pageName
      });
    } catch (e) {
      figma.ui.postMessage({ type: "scan-error", error: String((e && e.message) || e) });
    }
    return;
  }
  if (msg.type === "notify") { figma.notify(msg.text || ""); return; }
  if (msg.type === "close")  { figma.closePlugin(); return; }
};

// автопересканирование при смене выделения
figma.on("selectionchange", async () => {
  try {
    const result = await scan();
    figma.ui.postMessage({
      type: "scan-result",
      document: result.document,
      selection: result.selection,
      selectionCount: result.selectionCount,
      pageName: result.pageName
    });
  } catch (e) { /* ignore */ }
});
