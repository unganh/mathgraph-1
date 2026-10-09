(() => {
  "use strict";

  const canvas = document.getElementById("graph-canvas");
  const ctx = canvas.getContext("2d");
  const input = document.getElementById("function-input");
  const status = document.getElementById("status");
  const title = document.getElementById("graph-title");
  const tooltip = document.getElementById("canvas-tooltip");
  const rangeInputs = ["xmin", "xmax", "ymin", "ymax"].map(id => document.getElementById(id));
  let compiled = null;
  let currentFn = "x^2";
  let bounds = { xmin: -10, xmax: 10, ymin: -10, ymax: 10 };
  let cssWidth = 800, cssHeight = 500;
  let lastPoints = [];

  const nice = value => Number(value.toPrecision(5)).toString().replace("-", "−");
  const readBounds = () => {
    const values = rangeInputs.map(el => Number(el.value));
    if (values.some(v => !Number.isFinite(v)) || values[0] >= values[1] || values[2] >= values[3]) {
      throw new Error("Khoảng hiển thị không hợp lệ. Giá trị nhỏ nhất phải nhỏ hơn giá trị lớn nhất.");
    }
    if (values[1] - values[0] > 1e6 || values[3] - values[2] > 1e6) {
      throw new Error("Khoảng hiển thị quá rộng. Hãy chọn khoảng nhỏ hơn.");
    }
    return { xmin: values[0], xmax: values[1], ymin: values[2], ymax: values[3] };
  };

  function compileFunction(expression) {
    if (!expression.trim()) throw new Error("Vui lòng nhập một hàm số.");
    // Parse with math.js; only x is supplied as a variable during evaluation.
    const node = math.parse(expression);
    const compiledExpression = node.compile();
    const test = compiledExpression.evaluate({ x: 1 });
    if (typeof test !== "number" && !(test instanceof math.BigNumber)) {
      throw new Error("Biểu thức cần trả về một giá trị số thực.");
    }
    return compiledExpression;
  }

  function xToPixel(x) { return (x - bounds.xmin) / (bounds.xmax - bounds.xmin) * cssWidth; }
  function yToPixel(y) { return cssHeight - (y - bounds.ymin) / (bounds.ymax - bounds.ymin) * cssHeight; }
  function pixelToX(px) { return bounds.xmin + px / cssWidth * (bounds.xmax - bounds.xmin); }
  function pixelToY(py) { return bounds.ymin + (cssHeight - py) / cssHeight * (bounds.ymax - bounds.ymin); }

  function tickStep(span) {
    const rough = span / 10;
    const power = Math.pow(10, Math.floor(Math.log10(rough || 1)));
    const fraction = rough / power;
    return (fraction < 1.5 ? 1 : fraction < 3.5 ? 2 : fraction < 7.5 ? 5 : 10) * power;
  }

  function drawGrid() {
    ctx.clearRect(0, 0, cssWidth, cssHeight);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, cssWidth, cssHeight);
    const dx = tickStep(bounds.xmax - bounds.xmin);
    const dy = tickStep(bounds.ymax - bounds.ymin);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#edf0f6";
    ctx.fillStyle = "#8791a4";
    ctx.font = "10px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    for (let x = Math.ceil(bounds.xmin / dx) * dx; x <= bounds.xmax; x += dx) {
      const px = xToPixel(x);
      ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, cssHeight); ctx.stroke();
      if (Math.abs(x) > dx * .01) ctx.fillText(nice(x), px, Math.min(cssHeight - 14, Math.max(4, yToPixel(0) + 5)));
    }
    for (let y = Math.ceil(bounds.ymin / dy) * dy; y <= bounds.ymax; y += dy) {
      const py = yToPixel(y);
      ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(cssWidth, py); ctx.stroke();
      if (Math.abs(y) > dy * .01) {
        ctx.textAlign = "left";
        ctx.fillText(nice(y), Math.min(cssWidth - 30, Math.max(4, xToPixel(0) + 6)), py + 3);
      }
    }

    ctx.strokeStyle = "#68758a";
    ctx.lineWidth = 1.4;
    if (bounds.ymin <= 0 && bounds.ymax >= 0) {
      const py = yToPixel(0); ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(cssWidth, py); ctx.stroke();
      ctx.fillStyle = "#68758a"; ctx.textAlign = "right"; ctx.textBaseline = "bottom";
      ctx.fillText("x", cssWidth - 8, Math.max(12, py - 5));
    }
    if (bounds.xmin <= 0 && bounds.xmax >= 0) {
      const px = xToPixel(0); ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, cssHeight); ctx.stroke();
      ctx.fillStyle = "#68758a"; ctx.textAlign = "left"; ctx.textBaseline = "top";
      ctx.fillText("y", Math.min(cssWidth - 12, px + 6), 7);
    }
    if (bounds.xmin <= 0 && bounds.xmax >= 0 && bounds.ymin <= 0 && bounds.ymax >= 0) {
      ctx.fillStyle = "#68758a"; ctx.textAlign = "left"; ctx.textBaseline = "top";
      ctx.fillText("O", Math.min(cssWidth - 12, xToPixel(0) + 5), Math.min(cssHeight - 12, yToPixel(0) + 4));
    }
  }

  function drawCurve() {
    if (!compiled) return;
    lastPoints = [];
    const samples = Math.max(700, Math.floor(cssWidth * 1.5));
    const dx = (bounds.xmax - bounds.xmin) / samples;
    ctx.beginPath();
    ctx.strokeStyle = "#3978f6";
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    let drawing = false;
    let previousY = null;
    for (let i = 0; i <= samples; i++) {
      const x = bounds.xmin + i * dx;
      let y;
      try { y = compiled.evaluate({ x }); } catch { y = NaN; }
      if (typeof y !== "number" || !Number.isFinite(y) || Math.abs(y) > 1e12) {
        drawing = false; previousY = null; continue;
      }
      const px = xToPixel(x), py = yToPixel(y);
      if (!Number.isFinite(py) || py < -cssHeight * 10 || py > cssHeight * 11) {
        drawing = false; previousY = null; continue;
      }
      // Avoid connecting across vertical asymptotes/discontinuities.
      if (previousY !== null && Math.abs(py - previousY) > cssHeight * .8) drawing = false;
      if (!drawing) { ctx.moveTo(px, py); drawing = true; } else ctx.lineTo(px, py);
      previousY = py;
      lastPoints.push({ x, y, px, py });
    }
    ctx.stroke();
  }

  function render() {
    const rect = canvas.getBoundingClientRect();
    cssWidth = Math.max(320, rect.width);
    cssHeight = Math.max(260, rect.height);
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawGrid();
    drawCurve();
    document.getElementById("range-label").textContent =
      `x: ${nice(bounds.xmin)} đến ${nice(bounds.xmax)} · y: ${nice(bounds.ymin)} đến ${nice(bounds.ymax)}`;
  }

  function plot(expression = input.value) {
    try {
      const nextBounds = readBounds();
      const nextCompiled = compileFunction(expression);
      currentFn = expression.trim();
      compiled = nextCompiled;
      bounds = nextBounds;
      input.value = currentFn;
      title.textContent = "y = " + currentFn;
      status.textContent = "Đồ thị đã được cập nhật thành công.";
      status.style.color = "#198754";
      document.querySelectorAll(".preset").forEach(button => {
        button.classList.toggle("active", button.dataset.fn === currentFn);
      });
      render();
    } catch (error) {
      status.textContent = error.message || "Không thể vẽ hàm số này. Hãy kiểm tra cú pháp.";
      status.style.color = "#c0392b";
    }
  }

  document.getElementById("graph-form").addEventListener("submit", event => {
    event.preventDefault();
    plot();
  });
  document.querySelectorAll(".preset").forEach(button => {
    button.addEventListener("click", () => {
      input.value = button.dataset.fn;
      plot(button.dataset.fn);
    });
  });
  document.getElementById("apply-range").addEventListener("click", () => plot(currentFn));
  document.getElementById("reset-view").addEventListener("click", () => {
    rangeInputs.forEach((el, i) => el.value = [-10, 10, -10, 10][i]);
    plot(currentFn);
  });
  function zoom(factor) {
    const xmid = (bounds.xmin + bounds.xmax) / 2;
    const ymid = (bounds.ymin + bounds.ymax) / 2;
    const xhalf = (bounds.xmax - bounds.xmin) * factor / 2;
    const yhalf = (bounds.ymax - bounds.ymin) * factor / 2;
    bounds = { xmin: xmid - xhalf, xmax: xmid + xhalf, ymin: ymid - yhalf, ymax: ymid + yhalf };
    rangeInputs.forEach((el, i) => el.value = [bounds.xmin, bounds.xmax, bounds.ymin, bounds.ymax][i].toFixed(4));
    plot(currentFn);
  }
  document.getElementById("zoom-in").addEventListener("click", () => zoom(.7));
  document.getElementById("zoom-out").addEventListener("click", () => zoom(1.4));

  canvas.addEventListener("mousemove", event => {
    if (!compiled) return;
    const rect = canvas.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const x = pixelToX(px);
    let y;
    try { y = compiled.evaluate({ x }); } catch { y = NaN; }
    if (!Number.isFinite(y) || Math.abs(y) > 1e12) { tooltip.hidden = true; return; }
    tooltip.hidden = false;
    tooltip.style.left = `${Math.min(Math.max(5, px + 12), cssWidth - 130)}px`;
    tooltip.style.top = `${Math.min(Math.max(5, yToPixel(y) - 28), cssHeight - 32)}px`;
    tooltip.textContent = `x = ${nice(x)} · y = ${nice(y)}`;
  });
  canvas.addEventListener("mouseleave", () => { tooltip.hidden = true; });
  window.addEventListener("resize", render);

  plot("x^2");
})();
