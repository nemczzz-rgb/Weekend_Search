"use strict";

let map;
let lastReceipt;
let pendingReceipt;
let sdkPromise;
const form = document.querySelector("#probe-form");
const statusElement = document.querySelector("#status");
const runButton = document.querySelector("#run");
const labels = { passed: "пройдено", failed: "ошибка", not_run: "не проверено" };

function loadSdk(key) {
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const timeout = setTimeout(() => reject(new Error("sdk_timeout")), 25000);
    script.src = "https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=" + encodeURIComponent(key);
    script.onerror = () => { clearTimeout(timeout); reject(new Error("sdk_load_failed")); };
    script.onload = () => {
      if (!window.ymaps) { clearTimeout(timeout); reject(new Error("sdk_unavailable")); return; }
      window.ymaps.ready(() => { clearTimeout(timeout); resolve(); });
    };
    document.head.append(script);
  });
  return sdkPromise;
}

async function routeProbe(mode, points) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("route_timeout")), 25000);
    window.ymaps.route(points, { multiRoute: true, routingMode: mode, mapStateAutoApply: true }).then((route) => {
      try {
        map.geoObjects.add(route);
        const active = route.getActiveRoute();
        const duration = active?.properties.get("duration")?.value;
        const distance = active?.properties.get("distance")?.value;
        const valid = Number.isFinite(duration) && duration > 0 && Number.isFinite(distance) && distance > 0;
        clearTimeout(timeout);
        if (valid) resolve(); else reject(new Error("no_valid_route"));
      } catch { clearTimeout(timeout); reject(new Error("invalid_route_result")); }
    }, () => { clearTimeout(timeout); reject(new Error("route_failed")); });
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const device = document.querySelector("#device").value;
  const physical = document.querySelector("#physical-phone").checked;
  if (device === "phone" && !physical) {
    statusElement.textContent = "Подтвердите, что используете физический телефон. Эмуляция не закрывает контрольную точку.";
    return;
  }
  runButton.disabled = true;
  document.querySelector("#record").disabled = true;
  document.querySelector("#confirm-map").checked = false;
  document.querySelector("#confirm-map").disabled = true;
  document.querySelector("#download").disabled = true;
  const receipt = {
    device, viewport_width: window.innerWidth,
    physical_phone_confirmed: physical,
    free_tariff_confirmed: document.querySelector("#free-tariff").checked,
    map_loaded: false, pedestrian: "not_run", masstransit: "not_run",
  };
  statusElement.textContent = "Подключаем SDK. Проверка может занять до полутора минут.";
  try {
    await loadSdk(document.querySelector("#maps-key").value.trim());
    document.querySelector("#maps-key").value = "";
    if (map) map.destroy();
    map = new window.ymaps.Map("map", { center: [55.7558, 37.6176], zoom: 12, controls: ["zoomControl"] });
    document.querySelector("#confirm-map").disabled = false;
    document.querySelector("#map-state").textContent = "SDK готов; подтвердите подложку визуально";
    for (const [field, mode, points, target] of [
      ["pedestrian", "pedestrian", [[55.7522, 37.6019], [55.7602, 37.6186]], "#walk-state"],
      ["masstransit", "masstransit", [[55.7337, 37.5873], [55.8218, 37.6401]], "#transit-state"],
    ]) {
      statusElement.textContent = field === "pedestrian" ? "Проверяем реальный пеший маршрут…" : "Проверяем проезд на общественном транспорте…";
      try { await routeProbe(mode, points); receipt[field] = "passed"; }
      catch { receipt[field] = "failed"; }
      document.querySelector(target).textContent = labels[receipt[field]];
    }
  } catch {
    document.querySelector("#map-state").textContent = "не подтверждена";
  }
  pendingReceipt = receipt;
  document.querySelector("#record").disabled = false;
  statusElement.textContent = "Расчёты завершены. Проверьте карту визуально, затем зафиксируйте результат. Без подтверждения подложки проверка не засчитывается.";
  runButton.disabled = false;
});

document.querySelector("#record").addEventListener("click", async () => {
  if (!pendingReceipt) return;
  const receipt = { ...pendingReceipt, map_loaded: !document.querySelector("#confirm-map").disabled && document.querySelector("#confirm-map").checked };
  document.querySelector("#map-state").textContent = receipt.map_loaded ? "подтверждена визуально" : "не подтверждена";
  document.querySelector("#record").disabled = true;
  try {
    const response = await fetch("/api/receipts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(receipt) });
    if (!response.ok) throw new Error("receipt_failed");
    const result = await response.json();
    lastReceipt = result.receipt;
    document.querySelector("#receipt").textContent = JSON.stringify(lastReceipt, null, 2);
    document.querySelector("#download").disabled = false;
    statusElement.textContent = lastReceipt.passed
      ? "Проверки карты и проезда для этого устройства пройдены. Полная TASK-003 ещё требует остальных интеграций и второго устройства."
      : "Проверка не пройдена. Проверьте ключ, доступность сервисов и условия бесплатного тарифа. Успех не подставлялся.";
  } catch {
    statusElement.textContent = "Не удалось передать безопасный отчёт локальному серверу. Результат не засчитан.";
  } finally { document.querySelector("#record").disabled = false; }
});

document.querySelector("#download").addEventListener("click", () => {
  if (!lastReceipt) return;
  const url = URL.createObjectURL(new Blob([JSON.stringify(lastReceipt, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "weekend-search-map-probe-" + lastReceipt.device + ".json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
