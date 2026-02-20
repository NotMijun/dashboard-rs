function formatRupiahID(value) {
  const digits = String(value).replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("id-ID");
}

const REVENUE_INDEX = {
  today: 0,
  total: 1,
  target: 2,
};

let revenueArray = [0, 0, 0];

const THEME_KEY = "dashboard_theme";

function getDigitsFromElement(element) {
  if (!element) return 0;
  const digits = element.innerText.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

function animateRupiah(element, fromValue, toValue, duration, onComplete) {
  if (!element) return;
  const start = performance.now();

  function frame(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const currentValue = Math.round(
      fromValue + (toValue - fromValue) * progress
    );
    element.innerText = "Rp " + formatRupiahID(currentValue);

    if (progress < 1) {
      requestAnimationFrame(frame);
    } else if (typeof onComplete === "function") {
      onComplete();
    }
  }

  requestAnimationFrame(frame);
}

function saveRevenueArray() {
  try {
    localStorage.setItem("revenues_array", JSON.stringify(revenueArray));
  } catch (error) {}
}

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.body.classList.toggle("theme-dark", isDark);
  const toggle = document.getElementById("themeToggle");
  if (toggle) {
    toggle.textContent = isDark ? "Light mode" : "Dark mode";
  }
}

function initTheme() {
  let theme = localStorage.getItem(THEME_KEY);
  if (!theme) {
    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    theme = prefersDark ? "dark" : "light";
  }
  applyTheme(theme);
}

function toggleTheme() {
  const isCurrentlyDark = document.body.classList.contains("theme-dark");
  const nextTheme = isCurrentlyDark ? "light" : "dark";
  applyTheme(nextTheme);
  try {
    localStorage.setItem(THEME_KEY, nextTheme);
  } catch (error) {}
}

function calculateTotalRevenuePercent() {
  const revenueElement = document.getElementById("revenueText");
  const targetElement = document.getElementById("targetRevenueText");
  const percentElement = document.getElementById("totalRevenuePercent");

  if (!revenueElement || !targetElement || !percentElement) return;

  const revenue = Number(revenueElement.innerText.replace(/\D/g, ""));
  const target = Number(targetElement.innerText.replace(/\D/g, ""));

  if (!target || !revenue) {
    percentElement.innerText = "0%";
    return;
  }

  const percent = (revenue / target) * 100;
  percentElement.innerText = percent.toFixed(1) + "%";
}

function updateProgressBarColors() {
  const bars = document.querySelectorAll(".metric-progress-bar");
  bars.forEach(function (bar) {
    const widthStyle = bar.style.width || "";
    const target = parseFloat(widthStyle);
    if (Number.isNaN(target)) {
      return;
    }

    bar.dataset.targetWidth = String(target);
    bar.style.width = "0%";

    const card = bar.closest(".metric-card");
    const percentLabel =
      card && card.querySelector(".metric-percent");

    bar.classList.remove(
      "metric-progress-red",
      "metric-progress-orange",
      "metric-progress-green"
    );
    if (percentLabel) {
      percentLabel.classList.remove(
        "metric-percent-red",
        "metric-percent-orange",
        "metric-percent-green"
      );
    }

    let barClass;
    let percentClass;
    if (target >= 100) {
      barClass = "metric-progress-green";
      percentClass = "metric-percent-green";
    } else if (target >= 74) {
      barClass = "metric-progress-orange";
      percentClass = "metric-percent-orange";
    } else {
      barClass = "metric-progress-red";
      percentClass = "metric-percent-red";
    }

    bar.classList.add(barClass);
    if (percentLabel) {
      percentLabel.classList.add(percentClass);
    }

    const duration = 800;
    const start = performance.now();

    function frame(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentWidth = eased * target;
      bar.style.width = currentWidth.toFixed(1) + "%";
      if (progress < 1) {
        requestAnimationFrame(frame);
      }
    }

    requestAnimationFrame(frame);
  });
}

window.onload = function () {
  const skeletonRoot = document.getElementById("skeletonRoot");
  const dashboardRoot = document.getElementById("dashboardRoot");

  const revenueElement = document.getElementById("revenueText");
  const todayElement = document.getElementById("todayRevenueText");
  const targetElement = document.getElementById("targetRevenueText");

  initTheme();

  const themeToggleButton = document.getElementById("themeToggle");
  if (themeToggleButton) {
    themeToggleButton.addEventListener("click", toggleTheme);
  }

  const defaultToday = getDigitsFromElement(todayElement);
  const defaultTotal = getDigitsFromElement(revenueElement);
  const defaultTarget = getDigitsFromElement(targetElement);

  revenueArray = [defaultToday, defaultTotal, defaultTarget];

  const stored = localStorage.getItem("revenues_array");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length >= 3) {
        revenueArray[REVENUE_INDEX.today] = Number(parsed[REVENUE_INDEX.today]) || 0;
        revenueArray[REVENUE_INDEX.total] = Number(parsed[REVENUE_INDEX.total]) || 0;
        revenueArray[REVENUE_INDEX.target] = Number(parsed[REVENUE_INDEX.target]) || 0;
      }
    } catch (error) {}
  }

  const todayDigits = revenueArray[REVENUE_INDEX.today];
  const totalDigits = revenueArray[REVENUE_INDEX.total];
  const targetDigits = revenueArray[REVENUE_INDEX.target];

  animateRupiah(
    revenueElement,
    0,
    totalDigits,
    700,
    calculateTotalRevenuePercent
  );
  animateRupiah(todayElement, 0, todayDigits, 700);
  animateRupiah(
    targetElement,
    0,
    targetDigits,
    700,
    calculateTotalRevenuePercent
  );

  if (skeletonRoot && dashboardRoot) {
    setTimeout(function () {
      skeletonRoot.classList.add("hidden");
      dashboardRoot.classList.remove("hidden");
    }, 600);
  }

  updateProgressBarColors();
};

function updateRevenue() {
  const input = document.getElementById("inputRevenue").value;
  const digits = String(input).replace(/\D/g, "");

  const numeric = Number(digits) || 0;
  revenueArray[REVENUE_INDEX.total] = numeric;
  saveRevenueArray();

  const element = document.getElementById("revenueText");
  const fromValue = getDigitsFromElement(element);
  const toValue = numeric;

  animateRupiah(element, fromValue, toValue, 600, calculateTotalRevenuePercent);
}

function updateTodayRevenue() {
  const input = document.getElementById("inputTodayRevenue").value;
  const digits = String(input).replace(/\D/g, "");

  const numeric = Number(digits) || 0;
  revenueArray[REVENUE_INDEX.today] = numeric;
  saveRevenueArray();

  const element = document.getElementById("todayRevenueText");
  const fromValue = getDigitsFromElement(element);
  const toValue = numeric;

  animateRupiah(element, fromValue, toValue, 600);
}

function updateTargetRevenue() {
  const input = document.getElementById("inputTargetRevenue").value;
  const digits = String(input).replace(/\D/g, "");

  const numeric = Number(digits) || 0;
  revenueArray[REVENUE_INDEX.target] = numeric;
  saveRevenueArray();

  const element = document.getElementById("targetRevenueText");
  const fromValue = getDigitsFromElement(element);
  const toValue = numeric;

  animateRupiah(element, fromValue, toValue, 600, calculateTotalRevenuePercent);
}
