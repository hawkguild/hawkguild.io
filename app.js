const DEFAULT_USERS = [
  { username: "admin", password: "admin123", role: "Admin" },
  { username: "qc", password: "qc123", role: "QC" },
  { username: "supervisor", password: "sup123", role: "Supervisor" },
  { username: "viewer", password: "view123", role: "Viewer" }
];

const SEED = {
  users: structuredClone(DEFAULT_USERS),
  assets: [
    { id: "AST-1001", name: "โน้ตบุ๊ก Dell Latitude", category: "ครุภัณฑ์ IT", location: "ชั้น 2 / แผนกบัญชี", owner: "ฝ่ายบัญชี", status: "รอตรวจ" },
    { id: "AST-1002", name: "เครื่องพิมพ์ HP LaserJet", category: "อุปกรณ์สำนักงาน", location: "ชั้น 1 / ธุรการ", owner: "ธุรการ", status: "กำลังตรวจ" },
    { id: "AST-1003", name: "โปรเจคเตอร์ Epson", category: "ห้องประชุม", location: "ห้องประชุม A", owner: "ส่วนกลาง", status: "ผ่าน" },
    { id: "PRD-2001", name: "ชุดชิ้นงาน Lot A-07", category: "สินค้า QC", location: "คลังสินค้า QC", owner: "Production", status: "รอตรวจ" }
  ],
  inspections: [
    { date: "2026-07-07 09:20", assetId: "AST-1003", assetName: "โปรเจคเตอร์ Epson", result: "Pass", status: "ผ่าน", condition: "ปกติ", score: 98, inspector: "สมชาย", approver: "หัวหน้าแผนก", notes: "พร้อมใช้งาน", checks: 4, gps: "13.7563, 100.5018" },
    { date: "2026-07-08 14:10", assetId: "AST-1002", assetName: "เครื่องพิมพ์ HP LaserJet", result: "Fail", status: "ไม่ผ่าน", condition: "รอซ่อม", score: 62, inspector: "มาลี", approver: "", notes: "กระดาษติดบ่อย", checks: 2, gps: "13.7563, 100.5018" }
  ],
  defects: [
    { id: 1, assetId: "AST-1002", type: "ชำรุด", cause: "อุปกรณ์เสื่อม", note: "ลูกยางดึงกระดาษเสื่อม", resolved: false, date: "2026-07-08 14:12" }
  ],
  defectTypes: ["ชำรุด", "สูญหาย", "เอกสารไม่ตรง", "ใช้งานไม่ได้", "อื่น ๆ"],
  checklistStandards: [
    "ป้าย QR/Barcode อ่านได้",
    "สภาพภายนอกสมบูรณ์",
    "ใช้งานได้ตามมาตรฐาน",
    "ตำแหน่งตรงกับทะเบียนทรัพย์สิน"
  ],
  queue: []
};

let state = loadState();
let currentUser = null;
let selectedAssetId = state.assets[0]?.id || "";
let currentGps = "";

const $ = (id) => document.getElementById(id);

function loadState() {
  const saved = localStorage.getItem("qcState");
  if (!saved) {
    localStorage.setItem("qcState", JSON.stringify(SEED));
    return structuredClone(SEED);
  }
  try {
    return migrateState(JSON.parse(saved));
  } catch {
    return structuredClone(SEED);
  }
}

function migrateState(data) {
  return {
    ...structuredClone(SEED),
    ...data,
    users: Array.isArray(data.users) && data.users.length ? data.users : structuredClone(DEFAULT_USERS),
    assets: Array.isArray(data.assets) ? data.assets : structuredClone(SEED.assets),
    inspections: Array.isArray(data.inspections) ? data.inspections : [],
    defects: Array.isArray(data.defects) ? data.defects : [],
    defectTypes: Array.isArray(data.defectTypes) && data.defectTypes.length ? data.defectTypes : structuredClone(SEED.defectTypes),
    checklistStandards: Array.isArray(data.checklistStandards) && data.checklistStandards.length ? data.checklistStandards : structuredClone(SEED.checklistStandards),
    queue: Array.isArray(data.queue) ? data.queue : []
  };
}

function saveState() {
  localStorage.setItem("qcState", JSON.stringify(state));
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  window.setTimeout(() => toast.classList.add("hidden"), 3200);
}

function nowText() {
  return new Date().toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
}

function init() {
  $("todayText").textContent = new Date().toLocaleDateString("th-TH", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  bindEvents();
  hydrateSelects();
  renderAll();
}

function bindEvents() {
  $("loginForm").addEventListener("submit", login);
  $("logoutBtn").addEventListener("click", logout);
  document.querySelectorAll(".nav-item").forEach((button) => button.addEventListener("click", () => switchView(button.dataset.view)));
  $("scanBtn").addEventListener("click", scanAsset);
  $("scanInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") scanAsset();
  });
  $("assetSelect").addEventListener("change", (event) => {
    selectedAssetId = event.target.value;
    renderSelectedAsset();
  });
  $("inspectionForm").addEventListener("submit", saveInspection);
  $("inspectionAssetAdminForm").addEventListener("submit", saveInspectionAsset);
  $("checklistAdminForm").addEventListener("submit", saveChecklistItem);
  $("resultSelect").addEventListener("change", updateResultBadge);
  $("gpsBtn").addEventListener("click", captureGps);
  $("defectForm").addEventListener("submit", saveDefect);
  $("assetAdminForm").addEventListener("submit", saveAsset);
  $("defectTypeAdminForm").addEventListener("submit", saveDefectType);
  $("userAdminForm").addEventListener("submit", saveUser);
  $("defectFilter").addEventListener("change", renderDefects);
  $("chartMode").addEventListener("change", renderChart);
  $("reportSearch").addEventListener("input", renderReports);
  $("exportCsvBtn").addEventListener("click", exportCsv);
  $("printBtn").addEventListener("click", () => window.print());
  $("backupBtn").addEventListener("click", backupJson);
  $("restoreInput").addEventListener("change", restoreJson);
  $("seedBtn").addEventListener("click", resetSeed);
  $("syncBtn").addEventListener("click", syncQueue);
  $("notifyBtn").addEventListener("click", () => {
    const open = state.defects.filter((item) => !item.resolved).length;
    showToast(open ? `มีงานไม่ผ่าน/ข้อบกพร่องค้างอยู่ ${open} รายการ` : "ไม่มีแจ้งเตือนค้างอยู่");
  });
}

function login(event) {
  event.preventDefault();
  const username = $("username").value.trim();
  const password = $("password").value;
  const user = state.users.find((item) => item.username === username && item.password === password);
  if (!user) {
    showToast("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
    return;
  }
  currentUser = user;
  $("loginScreen").classList.add("hidden");
  $("appShell").classList.remove("hidden");
  $("roleBadge").textContent = user.role;
  applyRoleAccess();
  showToast(`เข้าสู่ระบบในสิทธิ์ ${user.role}`);
}

function logout() {
  currentUser = null;
  $("appShell").classList.add("hidden");
  $("loginScreen").classList.remove("hidden");
}

function applyRoleAccess() {
  const readOnly = currentUser?.role === "Viewer";
  const isAdmin = currentUser?.role === "Admin";
  document.querySelectorAll("form button, form input, form select, form textarea").forEach((el) => {
    if (el.closest("#loginForm")) return;
    el.disabled = readOnly;
  });
  document.querySelectorAll(".admin-only").forEach((el) => {
    el.classList.toggle("hidden", !isAdmin);
    el.querySelectorAll("button, input, select, textarea").forEach((field) => {
      field.disabled = !isAdmin;
    });
  });
  $("exportCsvBtn").disabled = false;
  $("printBtn").disabled = false;
}

function switchView(view) {
  document.querySelectorAll(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  document.querySelectorAll(".view").forEach((section) => section.classList.toggle("active", section.id === view));
  $("viewTitle").textContent = document.querySelector(`[data-view="${view}"]`).textContent;
}

function hydrateSelects() {
  const options = state.assets.map((asset) => `<option value="${asset.id}">${asset.id} - ${asset.name}</option>`).join("");
  const typeOptions = state.defectTypes.map((type) => `<option>${type}</option>`).join("");
  $("assetSelect").innerHTML = options;
  $("defectAssetSelect").innerHTML = options;
  $("defectType").innerHTML = typeOptions;
  $("assetSelect").value = selectedAssetId;
}

function renderAll() {
  hydrateSelects();
  renderDashboard();
  renderChart();
  renderRanking();
  renderSelectedAsset();
  renderDefects();
  renderReports();
  renderAssets();
  renderDefectTypes();
  renderUsers();
  renderChecklistStandards();
  updateSyncState();
}

function scanAsset() {
  const code = $("scanInput").value.trim().toUpperCase();
  const asset = state.assets.find((item) => item.id.toUpperCase() === code);
  if (!asset) {
    showToast("ไม่พบข้อมูลสินค้าหรือทรัพย์สินตามรหัสนี้");
    return;
  }
  selectedAssetId = asset.id;
  $("assetSelect").value = asset.id;
  renderSelectedAsset();
  switchView("scanner");
  showToast(`ดึงข้อมูล ${asset.id} สำเร็จ`);
}

function renderSelectedAsset() {
  const asset = state.assets.find((item) => item.id === selectedAssetId);
  if (!asset) return;
  $("selectedAssetBadge").textContent = `${asset.id} / ${asset.status}`;
  $("assetDetails").classList.remove("empty");
  $("assetDetails").innerHTML = `
    <div class="list-item"><strong>${asset.id}</strong>${asset.name}</div>
    <div class="list-item"><strong>ประเภท</strong>${asset.category}</div>
    <div class="list-item"><strong>ที่ตั้ง</strong>${asset.location}</div>
    <div class="list-item"><strong>ผู้รับผิดชอบ</strong>${asset.owner}</div>
    <div class="list-item"><strong>สถานะล่าสุด</strong>${asset.status}</div>
  `;
}

function updateResultBadge() {
  const result = $("resultSelect").value;
  const badge = $("selectedAssetBadge");
  badge.classList.remove("pass", "fail", "neutral");
  badge.classList.add(result === "Pass" ? "pass" : "fail");
}

function saveInspection(event) {
  event.preventDefault();
  const asset = state.assets.find((item) => item.id === $("assetSelect").value);
  if (!asset) {
    showToast("กรุณาเพิ่มหรือเลือกทรัพย์สินก่อนบันทึกการตรวจ");
    return;
  }
  const checkCount = [...document.querySelectorAll(".checkItem")].filter((item) => item.checked).length;
  const inspection = {
    date: nowText(),
    assetId: asset.id,
    assetName: asset.name,
    result: $("resultSelect").value,
    status: $("statusSelect").value,
    condition: $("conditionSelect").value,
    score: Number($("scoreInput").value || 0),
    inspector: $("inspectorSign").value.trim(),
    approver: $("approverSign").value.trim(),
    notes: $("notesInput").value.trim(),
    checks: checkCount,
    gps: currentGps || "ไม่ได้บันทึก"
  };
  state.inspections.unshift(inspection);
  asset.status = inspection.status;
  state.queue.push({ type: "inspection", date: inspection.date, assetId: asset.id });
  if (inspection.result === "Fail") {
    state.defects.unshift({
      id: Date.now(),
      assetId: asset.id,
      type: inspection.condition,
      cause: "ผลตรวจไม่ผ่าน",
      note: inspection.notes || "ต้องตรวจสอบเพิ่มเติม",
      resolved: false,
      date: inspection.date
    });
    showToast("บันทึกงานไม่ผ่านและแจ้งเตือนผู้รับผิดชอบแล้ว");
  } else {
    showToast("บันทึกผลตรวจสำเร็จ");
  }
  saveState();
  renderAll();
}

function saveInspectionAsset(event) {
  event.preventDefault();
  if (currentUser?.role !== "Admin") {
    showToast("เฉพาะ Admin เท่านั้นที่เพิ่มรหัสทรัพย์สินได้");
    return;
  }
  const id = $("quickAssetId").value.trim().toUpperCase();
  if (state.assets.some((asset) => asset.id.toUpperCase() === id)) {
    showToast("รหัสทรัพย์สินนี้มีอยู่แล้ว");
    return;
  }
  const name = $("quickAssetName").value.trim() || `ทรัพย์สิน ${id}`;
  const asset = {
    id,
    name,
    category: "เพิ่มจากหน้า Inspection",
    location: "ยังไม่ระบุ",
    owner: currentUser.username,
    status: "รอตรวจ"
  };
  state.assets.unshift(asset);
  selectedAssetId = asset.id;
  state.queue.push({ type: "asset", date: nowText(), assetId: asset.id });
  saveState();
  event.target.reset();
  renderAll();
  $("assetSelect").value = asset.id;
  showToast(`เพิ่มและเลือกทรัพย์สิน ${asset.id} แล้ว`);
}

function saveChecklistItem(event) {
  event.preventDefault();
  if (currentUser?.role !== "Admin") {
    showToast("เฉพาะ Admin เท่านั้นที่เพิ่มเช็กลิสต์มาตรฐานได้");
    return;
  }
  const item = $("newChecklistItem").value.trim();
  if (state.checklistStandards.some((standard) => standard.toLowerCase() === item.toLowerCase())) {
    showToast("เช็กลิสต์นี้มีอยู่แล้ว");
    return;
  }
  state.checklistStandards.push(item);
  state.queue.push({ type: "checklist", date: nowText(), value: item });
  saveState();
  event.target.reset();
  renderAll();
  showToast(`เพิ่มเช็กลิสต์ "${item}" แล้ว`);
}

function captureGps() {
  const setFallback = () => {
    currentGps = "13.7563, 100.5018";
    $("gpsText").textContent = `${currentGps} / ${nowText()}`;
    showToast("บันทึกพิกัดจำลองแล้ว");
  };
  if (!navigator.geolocation) {
    setFallback();
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (position) => {
      currentGps = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
      $("gpsText").textContent = `${currentGps} / ${nowText()}`;
      showToast("บันทึก GPS และเวลาแล้ว");
    },
    setFallback,
    { timeout: 4000 }
  );
}

function saveDefect(event) {
  event.preventDefault();
  state.defects.unshift({
    id: Date.now(),
    assetId: $("defectAssetSelect").value,
    type: $("defectType").value,
    cause: $("defectCause").value.trim(),
    note: $("defectNote").value.trim(),
    resolved: false,
    date: nowText()
  });
  state.queue.push({ type: "defect", date: nowText(), assetId: $("defectAssetSelect").value });
  event.target.reset();
  saveState();
  renderAll();
  showToast("เพิ่มข้อบกพร่องและแจ้งเตือนผู้รับผิดชอบแล้ว");
}

function saveAsset(event) {
  event.preventDefault();
  if (currentUser?.role !== "Admin") {
    showToast("เฉพาะ Admin เท่านั้นที่เพิ่มทรัพย์สินได้");
    return;
  }
  const id = $("newAssetId").value.trim().toUpperCase();
  if (state.assets.some((asset) => asset.id.toUpperCase() === id)) {
    showToast("รหัสทรัพย์สินนี้มีอยู่แล้ว");
    return;
  }
  const asset = {
    id,
    name: $("newAssetName").value.trim(),
    category: $("newAssetCategory").value.trim(),
    location: $("newAssetLocation").value.trim(),
    owner: $("newAssetOwner").value.trim(),
    status: $("newAssetStatus").value
  };
  state.assets.unshift(asset);
  selectedAssetId = asset.id;
  state.queue.push({ type: "asset", date: nowText(), assetId: asset.id });
  saveState();
  event.target.reset();
  renderAll();
  showToast(`เพิ่มทรัพย์สิน ${asset.id} แล้ว`);
}

function saveDefectType(event) {
  event.preventDefault();
  if (currentUser?.role !== "Admin") {
    showToast("เฉพาะ Admin เท่านั้นที่เพิ่มประเภทปัญหาได้");
    return;
  }
  const type = $("newDefectType").value.trim();
  if (state.defectTypes.some((item) => item.toLowerCase() === type.toLowerCase())) {
    showToast("ประเภทปัญหานี้มีอยู่แล้ว");
    return;
  }
  state.defectTypes.push(type);
  state.queue.push({ type: "defectType", date: nowText(), value: type });
  saveState();
  event.target.reset();
  renderAll();
  $("defectType").value = type;
  showToast(`เพิ่มประเภทปัญหา "${type}" แล้ว`);
}

function saveUser(event) {
  event.preventDefault();
  if (currentUser?.role !== "Admin") {
    showToast("เฉพาะ Admin เท่านั้นที่เพิ่ม User ได้");
    return;
  }
  const username = $("newUsername").value.trim();
  const password = $("newUserPassword").value;
  const role = $("newUserRole").value;
  if (state.users.some((user) => user.username.toLowerCase() === username.toLowerCase())) {
    showToast("Username นี้มีอยู่แล้ว");
    return;
  }
  state.users.push({ username, password, role });
  state.queue.push({ type: "user", date: nowText(), username, role });
  saveState();
  event.target.reset();
  renderAll();
  showToast(`เพิ่ม User ${username} สิทธิ์ ${role} แล้ว`);
}

function renderDefects() {
  const filter = $("defectFilter").value;
  const defects = state.defects.filter((item) => filter === "all" || (filter === "open" ? !item.resolved : item.resolved));
  $("defectList").innerHTML = defects.length
    ? defects.map((item) => `
      <article class="list-item">
        <strong>${item.assetId} / ${item.type}</strong>
        <span>${item.cause} - ${item.note || "ไม่มีหมายเหตุ"}</span>
        <p class="hint">${item.date} / ${item.resolved ? "แก้ไขแล้ว" : "ยังไม่แก้ไข"}</p>
        <button class="secondary" onclick="toggleDefect(${item.id})">${item.resolved ? "เปิดใหม่" : "ทำเครื่องหมายแก้ไขแล้ว"}</button>
      </article>
    `).join("")
    : `<div class="details empty">ไม่มีรายการ</div>`;
}

function toggleDefect(id) {
  const defect = state.defects.find((item) => item.id === id);
  if (!defect) return;
  defect.resolved = !defect.resolved;
  saveState();
  renderAll();
}

function renderDashboard() {
  const total = state.inspections.length;
  const pass = state.inspections.filter((item) => item.result === "Pass").length;
  const fail = state.inspections.filter((item) => item.result === "Fail").length;
  $("totalInspections").textContent = total;
  $("passRate").textContent = total ? `${Math.round((pass / total) * 100)}%` : "0%";
  $("failRate").textContent = total ? `${Math.round((fail / total) * 100)}%` : "0%";
  $("openDefects").textContent = state.defects.filter((item) => !item.resolved).length;
}

function renderChart() {
  const labels = $("chartMode").value === "monthly" ? ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค."] : ["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."];
  const values = labels.map((_, index) => Math.max(1, state.inspections.length + index - 2));
  const max = Math.max(...values);
  $("barChart").innerHTML = labels.map((label, index) => `
    <div class="bar">
      <div class="bar-fill" style="height:${Math.round((values[index] / max) * 220)}px"></div>
      <span>${label}</span>
      <strong>${values[index]}</strong>
    </div>
  `).join("");
}

function renderRanking() {
  const causes = state.defects.reduce((acc, item) => {
    acc[item.cause] = (acc[item.cause] || 0) + 1;
    return acc;
  }, {});
  const rows = Object.entries(causes).sort((a, b) => b[1] - a[1]);
  $("causeRanking").innerHTML = rows.length
    ? rows.map(([cause, count]) => `<li><strong>${cause}</strong><p class="hint">${count} ครั้ง</p></li>`).join("")
    : `<li>ยังไม่มีข้อมูล</li>`;
}

function renderReports() {
  const keyword = $("reportSearch").value.trim().toLowerCase();
  const rows = state.inspections.filter((item) => JSON.stringify(item).toLowerCase().includes(keyword));
  $("reportRows").innerHTML = rows.map((item) => `
    <tr>
      <td>${item.date}</td>
      <td>${item.assetId}</td>
      <td>${item.assetName}</td>
      <td>${item.result}</td>
      <td>${item.condition}</td>
      <td>${item.score}</td>
      <td>${item.inspector}</td>
    </tr>
  `).join("");
}

function renderAssets() {
  $("assetList").innerHTML = state.assets.map((asset) => `
    <article class="list-item">
      <strong>${asset.id} - ${asset.name}</strong>
      <span>${asset.category} / ${asset.location}</span>
      <p class="hint">${asset.owner} / ${asset.status}</p>
    </article>
  `).join("");
}

function renderDefectTypes() {
  $("defectTypeList").innerHTML = state.defectTypes.map((type) => `
    <article class="list-item">
      <strong>${type}</strong>
      <span class="hint">ใช้ได้ในฟอร์มบันทึกข้อบกพร่อง</span>
    </article>
  `).join("");
}

function renderUsers() {
  $("userList").innerHTML = state.users.map((user) => `
    <article class="list-item">
      <strong>${user.username}</strong>
      <span>สิทธิ์: ${user.role}</span>
      <p class="hint">${user.username === "admin" ? "บัญชีหลักของระบบ" : "บัญชีที่สามารถเข้าสู่ระบบได้"}</p>
    </article>
  `).join("");
}

function renderChecklistStandards() {
  $("checklistItems").innerHTML = state.checklistStandards.map((item, index) => `
    <label>
      <input type="checkbox" class="checkItem" data-check-index="${index}" checked />
      ${item}
    </label>
  `).join("");
}

function exportCsv() {
  const header = ["date", "assetId", "assetName", "result", "condition", "score", "inspector", "approver", "gps", "notes"];
  const rows = state.inspections.map((item) => header.map((key) => `"${String(item[key] ?? "").replaceAll('"', '""')}"`).join(","));
  const blob = new Blob([`\ufeff${header.join(",")}\n${rows.join("\n")}`], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, `qc-report-${Date.now()}.csv`);
}

function backupJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  downloadBlob(blob, `qc-backup-${Date.now()}.json`);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function restoreJson(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      state = migrateState(JSON.parse(reader.result));
      saveState();
      renderAll();
      showToast("กู้คืนข้อมูลสำเร็จ");
    } catch {
      showToast("ไฟล์ JSON ไม่ถูกต้อง");
    }
  };
  reader.readAsText(file);
}

function resetSeed() {
  state = structuredClone(SEED);
  selectedAssetId = state.assets[0].id;
  saveState();
  renderAll();
  showToast("โหลดข้อมูลตัวอย่างใหม่แล้ว");
}

function syncQueue() {
  const count = state.queue.length;
  state.queue = [];
  saveState();
  updateSyncState();
  showToast(count ? `ซิงค์ข้อมูลจำลอง ${count} รายการสำเร็จ` : "ไม่มีข้อมูลรอซิงค์");
}

function updateSyncState() {
  const syncState = $("syncState");
  if (syncState) {
    syncState.textContent = state.queue.length ? `รอซิงค์ ${state.queue.length}` : "Offline Ready";
  }
}

window.toggleDefect = toggleDefect;
init();
