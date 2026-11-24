/* =========================================================
   استراتژی‌های حمل‌ونقل عمومی — اسکریپت تعاملی
   شامل: داده شاخص‌ها، نمودارها، ماشین‌حساب، تم و منو
   ========================================================= */
"use strict";

/* ---------- داده شاخص‌های کلیدی (نمونه شهر) ---------- */
const KPI_DATA = [
  { title: "پوشش جمعیت در ۵۰۰ متری ایستگاه", value: "68", unit: "٪", group: "access" },
  { title: "دسترسی افراد دارای معلولیت به ایستگاه‌ها", value: "72", unit: "٪", group: "access" },
  { title: "تراکم شبکه به‌ازای ۱۰۰ هزار نفر", value: "14.5", unit: "کیلومتر", group: "access" },
  { title: "میانگین سرعت تجاری شبکه", value: "21", unit: "km/h", group: "efficiency" },
  { title: "سهم حمل‌ونقل عمومی از سفرهای موتوری", value: "34", unit: "٪", group: "efficiency" },
  { title: "سفر در هر کیلومتر سرویس (بار مسافری)", value: "4.8", unit: "مسافر", group: "efficiency" },
  { title: "دقت زمان‌بندی سرویس‌ها", value: "88", unit: "٪", group: "quality" },
  { title: "شاخص رضایت مسافران", value: "7.4", unit: "/10", group: "quality" },
  { title: "فراوانی سرویس در ساعات اوج", value: "6", unit: "دقیقه", group: "quality" },
  { title: "تصادفات در هر میلیون مسافر-کیلومتر", value: "13", unit: "", group: "safety" },
  { title: "سهم ناوگان با سامانه نظارت و ایمنی", value: "91", unit: "٪", group: "safety" },
  { title: "انتشار CO₂ سرانه حمل‌ونقل عمومی", value: "42", unit: "g/km", group: "environment" },
  { title: "سهم ناوگان با سوخت پاک", value: "27", unit: "٪", group: "environment" },
  { title: "سهم سفرهای غیرموتوری (پیاده و دوچرخه)", value: "19", unit: "٪", group: "environment" },
];

const GROUP_LABELS = {
  all: "همه حوزه‌ها",
  access: "دسترسی‌پذیری",
  efficiency: "کارایی",
  quality: "کیفیت خدمات",
  safety: "ایمنی",
  environment: "محیط زیست",
};

const GROUP_EMOJIS = {
  access: "📍",
  efficiency: "⚙️",
  quality: "⭐",
  safety: "🛡️",
  environment: "🌿",
};

/* ---------- کمکی‌های DOM ---------- */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

/* ---------- منوی موبایل ---------- */
const menuToggle = $("#menuToggle");
const navMenu = $("#navMenu");

menuToggle.addEventListener("click", () => {
  const open = navMenu.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
});

navMenu.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navMenu.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

/* ---------- تم روشن/تیره ---------- */
const THEME_KEY = "stm-theme";
const themeToggle = $("#themeToggle");
const themeIcon = themeToggle.querySelector(".theme-icon");

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeIcon.textContent = theme === "dark" ? "☀️" : "🌙";
  localStorage.setItem(THEME_KEY, theme);
}

const savedTheme = localStorage.getItem(THEME_KEY) ||
  (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
applyTheme(savedTheme);

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  applyTheme(current === "dark" ? "light" : "dark");
});

/* ---------- داشبورد شاخص‌ها ---------- */
const kpiGrid = $("#kpiGrid");
let activeFilter = "all";

function renderKpis(filter) {
  const items = KPI_DATA.filter((k) => filter === "all" || k.group === filter);
  kpiGrid.innerHTML = items
    .map(
      (k, i) => `
      <article class="kpi-card" data-group="${k.group}" style="animation-delay:${i * 40}ms"
               tabindex="0" role="button" aria-label="جزئیات شاخص ${k.title}">
        <span class="kpi-tag">${GROUP_EMOJIS[k.group]} ${GROUP_LABELS[k.group]}</span>
        <p class="kpi-value">${k.value} <small>${k.unit}</small></p>
        <h4 class="kpi-title">${k.title}</h4>
      </article>`
    )
    .join("");

  kpiGrid.querySelectorAll(".kpi-card").forEach((card) => {
    const openDetail = () => {
      card.style.outline = "2px solid var(--accent)";
      setTimeout(() => (card.style.outline = ""), 1200);
    };
    card.addEventListener("click", openDetail);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openDetail();
      }
    });
  });
}

$$(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    $$(".chip").forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    activeFilter = chip.dataset.filter;
    renderKpis(activeFilter);
  });
});

renderKpis(activeFilter);

/* ---------- نمودارها (بدون کتابخانه خارجی) ---------- */
function renderPieChart(canvasId, data, colors) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;

  const size = Math.min(300, Math.floor(canvas.clientWidth || 300));
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  ctx.scale(dpr, dpr);

  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 12;

  const total = data.reduce((s, d) => s + d.value, 0);
  let angle = -Math.PI / 2;

  data.forEach((d, i) => {
    const slice = (d.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, angle, angle + slice);
    ctx.closePath();
    ctx.fillStyle = colors[i];
    ctx.fill();
    angle += slice;
  });

  // برچسب‌ها
  angle = -Math.PI / 2;
  ctx.font = "bold 12px Vazirmatn, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  data.forEach((d, i) => {
    const slice = (d.value / total) * Math.PI * 2;
    const mid = angle + slice / 2;
    const labelR = radius * 0.68;
    const lx = cx + Math.cos(mid) * labelR;
    const ly = cy + Math.sin(mid) * labelR;
    ctx.fillStyle = "#fff";
    ctx.fillText(Math.round((d.value / total) * 100) + "٪", lx, ly);
    angle += slice;
  });

  // مرکز
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.42, 0, Math.PI * 2);
  ctx.fillStyle = getComputedStyle(document.documentElement)
    .getPropertyValue("--surface")
    .trim() || "#ffffff";
  ctx.fill();
  ctx.fillStyle = getComputedStyle(document.documentElement)
    .getPropertyValue("--text")
    .trim() || "#0f172a";
  ctx.font = "700 13px Vazirmatn, sans-serif";
  ctx.fillText("سفرهای", cx, cy - 9);
  ctx.fillText("شهری", cx, cy + 10);

  if (document.querySelector("#modalLegend")) renderLegend("modalLegend", data, colors);
}

function renderLegend(legendId, data, colors) {
  const host = document.getElementById(legendId);
  if (!host) return;
  host.innerHTML = data
    .map(
      (d, i) => `
      <li>
        <span class="legend-color" style="background:${colors[i]}"></span>
        ${d.label}: <strong>${d.value}٪</strong>
      </li>`
    )
    .join("");
}

function renderBarChart(canvasId, labels, data) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;

  const width = Math.max(320, Math.floor(canvas.clientWidth || 340));
  const height = 260;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  const pad = { top: 26, right: 20, bottom: 44, left: 48 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;

  const max = Math.max(...data) * 1.15;
  const cssText = getComputedStyle(document.documentElement);
  const primary = cssText.getPropertyValue("--primary").trim() || "#0e7490";
  const accent = cssText.getPropertyValue("--accent").trim() || "#f59e0b";
  const textColor = cssText.getPropertyValue("--muted").trim() || "#64748b";
  const gridColor = cssText.getPropertyValue("--border").trim() || "#e2e8f0";

  // شبکه افقی
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  ctx.font = "11px Vazirmatn, sans-serif";
  ctx.fillStyle = textColor;
  ctx.textAlign = "right";
  for (let i = 0; i <= 4; i++) {
    const v = (max / 4) * i;
    const y = pad.top + chartH - (v / max) * chartH;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(width - pad.right, y);
    ctx.stroke();
    ctx.fillText(Math.round(v * 10) / 10, pad.left - 8, y + 4);
  }

  const barW = Math.min(46, (chartW / labels.length) * 0.55);
  const step = chartW / labels.length;

  labels.forEach((label, i) => {
    const cx = pad.left + step * i + step / 2;
    const h = (data[i] / max) * chartH;
    const y = pad.top + chartH - h;

    const gradient = ctx.createLinearGradient(0, y, 0, pad.top + chartH);
    gradient.addColorStop(0, primary);
    gradient.addColorStop(1, accent);
    ctx.fillStyle = gradient;

    const r = 6;
    const x = cx - barW / 2;
    ctx.beginPath();
    ctx.moveTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.arcTo(x + barW, y, x + barW, y + r, r);
    ctx.arcTo(x + barW, pad.top + chartH, x + barW - r, pad.top + chartH, r);
    ctx.arcTo(x, pad.top + chartH, x, pad.top + chartH - r, r);
    ctx.closePath();
    ctx.fill();

    // مقدار روی میله
    ctx.fillStyle = textColor;
    ctx.font = "700 11px Vazirmatn, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(data[i]), cx, y - 8);

    // برچسب محور
    ctx.font = "11px Vazirmatn, sans-serif";
    ctx.fillText(label, cx, pad.top + chartH + 20);
  });
}

/* ---------- داده نمودارها ---------- */
const MODAL_SPLIT = [
  { label: "اتوبوس", value: 21 },
  { label: "مترو", value: 13 },
  { label: "تاکسی", value: 11 },
  { label: "خودرو شخصی", value: 36 },
  { label: "پیاده و دوچرخه", value: 19 },
];
const MODAL_COLORS = ["#0e7490", "#0369a1", "#f59e0b", "#94a3b8", "#16a34a"];

const RIDERSHIP_LABELS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور"];
const RIDERSHIP_DATA = [38, 42, 40, 45, 49, 52];

function drawCharts() {
  renderPieChart("modalSplitChart", MODAL_SPLIT, MODAL_COLORS);
  renderBarChart("ridershipChart", RIDERSHIP_LABELS, RIDERSHIP_DATA);
}

window.addEventListener("resize", drawCharts);
drawCharts();

/* ---------- ماشین‌حساب شاخص رضایت ---------- */
const calcForm = $("#calcForm");
const calcResult = $("#calcResult");
const calcScore = $("#calcScore");
const calcBar = $("#calcBar");
const calcNote = $("#calcNote");

const fieldIds = ["calcWait", "calcCapacity", "calcSpeed", "calcSafety", "calcClean"];

function fieldValue(id) {
  const el = document.getElementById(id);
  const v = parseFloat(el.value);
  if (Number.isNaN(v)) return null;
  return Math.min(10, Math.max(0, v));
}

calcForm.addEventListener("submit", (e) => {
  e.preventDefault();

  let invalid = false;
  fieldIds.forEach((id) => {
    const el = document.getElementById(id);
    const v = fieldValue(id);
    const ok = v !== null && v >= 0 && v <= 10;
    el.style.borderColor = ok ? "" : "#ef4444";
    if (!ok) invalid = true;
  });
  if (invalid) {
    calcNote.textContent = "لطفاً همه مقادیر را بین ۰ تا ۱۰ وارد کنید.";
    calcResult.hidden = false;
    calcScore.textContent = "—";
    calcBar.style.width = "0";
    return;
  }

  const values = fieldIds.map(fieldValue);
  const score = values.reduce((a, b) => a + b, 0) / values.length;
  const rounded = Math.round(score * 100) / 100;

  calcScore.textContent = rounded.toLocaleString("fa-IR");
  calcResult.hidden = false;
  requestAnimationFrame(() => {
    calcBar.style.width = score * 10 + "%";
  });

  let note;
  if (score >= 8) note = "عالی! خدمات در وضعیت بسیار مطلوبی قرار دارد. 🎉";
  else if (score >= 6.5) note = "خوب؛ با بهبود نقاط ضعف می‌توان به سطح عالی رسید. 🙂";
  else if (score >= 5) note = "متوسط؛ نیاز به برنامه بهبود هدفمند دارد. 🤔";
  else note = "ضعیف؛ اقدام فوری برای ارتقای کیفیت خدمات لازم است. ⚠️";
  calcNote.textContent = note;

  calcResult.scrollIntoView({ behavior: "smooth", block: "nearest" });
});

fieldIds.forEach((id) => {
  document.getElementById(id).addEventListener("input", (e) => {
    e.target.style.borderColor = "";
  });
});

/* ---------- سال پاصفحه ---------- */
const yearEl = $("#year");
if (yearEl) yearEl.textContent = new Date().getFullYear();