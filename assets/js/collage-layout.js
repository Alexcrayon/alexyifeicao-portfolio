// Photo collage layouts, switched by the Diamond / Rows buttons (the choice is
// remembered for the next visit).
//   "justified": pure CSS, rows of equal height that fill the width.
//   "diamond":   centered rows whose widths step up to the middle and back down.
//                This script picks the row count and grouping that keeps every
//                row closest to the target height, and redoes it on resize.
// Loaded right after the collage (not deferred) so the layout is in place
// before the first paint.
(() => {
  const collage = document.querySelector(".collage");
  const toggle = document.querySelector(".layout-toggle");
  if (!collage || !toggle) return;

  const buttons = toggle.querySelectorAll("button");
  const items = [...collage.querySelectorAll(".collage-item")];
  const ratios = items.map((item) => parseFloat(item.style.getPropertyValue("--ar")));

  // prefix[j] = sum of the first j aspect ratios, so any row's total is one subtraction
  const prefix = [0];
  ratios.forEach((r) => prefix.push(prefix[prefix.length - 1] + r));

  // Row widths (fractions of the collage width) for a diamond of rowCount rows
  const diamondWidths = (rowCount, minWidth) => {
    const mid = (rowCount - 1) / 2;
    return Array.from({ length: rowCount }, (_, r) =>
      mid === 0 ? 1 : minWidth + (1 - minWidth) * (1 - Math.abs(r - mid) / mid)
    );
  };

  // Split the photos, in order, into one non-empty row per width so each row's
  // height is as close as possible to the target (squared log error, so too tall
  // and too short count the same). Returns the mean error and [start, end) per row.
  const partition = (widths, width, gap, target) => {
    const n = ratios.length;
    const rowCount = widths.length;
    let best = new Array(n + 1).fill(Infinity);
    best[0] = 0;
    const starts = [];

    for (let r = 0; r < rowCount; r++) {
      const next = new Array(n + 1).fill(Infinity);
      const from = new Array(n + 1).fill(-1);
      const rowWidth = widths[r] * width;

      for (let j = r + 1; j <= n - (rowCount - 1 - r); j++) {
        for (let i = r; i < j; i++) {
          if (best[i] === Infinity) continue;
          const height = (rowWidth - gap * (j - i - 1)) / (prefix[j] - prefix[i]);
          if (height <= 0) continue;
          const cost = best[i] + Math.log(height / target) ** 2;
          if (cost < next[j]) {
            next[j] = cost;
            from[j] = i;
          }
        }
      }
      starts.push(from);
      best = next;
    }

    const rows = [];
    for (let r = rowCount - 1, end = n; r >= 0; r--) {
      const start = starts[r][end];
      rows.unshift([start, end]);
      end = start;
    }
    return { error: best[n] / rowCount, rows };
  };

  const buildDiamond = (width) => {
    const style = getComputedStyle(collage);
    const gap = parseFloat(style.columnGap) || 0;
    const target = parseFloat(style.getPropertyValue("--row-height")) || 240;
    // The narrowest rows fit about one landscape photo
    const minWidth = Math.min(1, (1.5 * target) / width);

    // Try every odd row count (capped, so huge galleries stay fast) and keep the best
    let best = null;
    for (let rowCount = 1; rowCount <= Math.min(ratios.length, 31); rowCount += 2) {
      const widths = diamondWidths(rowCount, minWidth);
      const result = partition(widths, width, gap, target);
      if (!best || result.error < best.error) best = { ...result, widths };
    }

    const rows = best.rows.map(([start, end], r) => {
      const row = document.createElement("div");
      row.className = "collage-row";
      row.style.setProperty("--row-width", `${best.widths[r] * 100}%`);
      row.append(...items.slice(start, end));
      return row;
    });
    collage.replaceChildren(...rows);
  };

  let builtWidth = 0;
  const refresh = () => {
    const width = collage.clientWidth;
    if (collage.dataset.layout !== "diamond" || !items.length || width === builtWidth) return;
    builtWidth = width;
    buildDiamond(width);
  };

  const apply = (layout) => {
    collage.dataset.layout = layout;
    buttons.forEach((b) => b.setAttribute("aria-pressed", b.dataset.layout === layout));
    refresh();
  };

  let saved = null;
  try {
    saved = localStorage.getItem("collage-layout");
  } catch (e) {}
  apply(saved === "justified" ? "justified" : "diamond");
  toggle.hidden = false;

  buttons.forEach((b) =>
    b.addEventListener("click", () => {
      apply(b.dataset.layout);
      try {
        localStorage.setItem("collage-layout", b.dataset.layout);
      } catch (e) {}
    })
  );

  new ResizeObserver(refresh).observe(collage);
})();
