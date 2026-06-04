const STORE_KEY = "mae-lamai-southern-pos.full.v1";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const demo = {
  shop: {
    name: "แกงใต้แม่ละม้ายเมืองคอน",
    branch: "สาขานครศรีธรรมราช",
    address: "ตลาดเมืองคอน อ.เมือง จ.นครศรีธรรมราช",
    phone: "075-000-999",
    taxId: "0800000000000",
    serviceRate: 0,
    taxRate: 7
  },
  receipt: {
    title: "ใบเสร็จรับเงิน",
    posId: "POS-01",
    headerNote: "อาหารใต้รสจัดจ้าน ปรุงสดทุกจาน",
    footerNote: "ขอบคุณที่อุดหนุน แวะมาใหม่เด้อ"
  },
  tables: [
    { id: "T1", name: "โต๊ะ 1" },
    { id: "T2", name: "โต๊ะ 2" },
    { id: "T3", name: "โต๊ะ 3" },
    { id: "TA", name: "กลับบ้าน" },
    { id: "DL", name: "เดลิเวอรี" },
    { id: "SF", name: "ShopeeFood", online: true, platform: "ShopeeFood", color: "#ee4d2d" },
    { id: "LM", name: "LINE MAN", online: true, platform: "LINE MAN", color: "#06c755" }
  ],
  sellers: [
    { id: uid(), name: "แม่ละม้าย", role: "เจ้าของร้าน", shiftStart: "08:00", shiftEnd: "16:00", active: true },
    { id: uid(), name: "น้องบ่าว", role: "แคชเชียร์", shiftStart: "16:00", shiftEnd: "22:00", active: false }
  ],
  activeSellerId: "",
  menu: [
    { id: uid(), name: "แกงไตปลา", category: "แกงใต้", price: 120, available: true, image: "" },
    { id: uid(), name: "แกงเหลืองปลากะพง", category: "แกงใต้", price: 160, available: true, image: "" },
    { id: uid(), name: "คั่วกลิ้งหมู", category: "ผัด/คั่ว", price: 130, available: true, image: "" },
    { id: uid(), name: "สะตอผัดกะปิกุ้ง", category: "ผัด/คั่ว", price: 180, available: true, image: "" },
    { id: uid(), name: "ใบเหลียงผัดไข่", category: "ผัด/คั่ว", price: 95, available: true, image: "" },
    { id: uid(), name: "หมูฮ้องเมืองคอน", category: "กับข้าว", price: 150, available: true, image: "" },
    { id: uid(), name: "ปลาทรายทอดขมิ้น", category: "ทอด", price: 140, available: true, image: "" },
    { id: uid(), name: "ข้าวยำปักษ์ใต้", category: "จานเดียว", price: 85, available: true, image: "" },
    { id: uid(), name: "ข้าวสวย", category: "ข้าว", price: 15, available: true, image: "" },
    { id: uid(), name: "ชาเย็น", category: "เครื่องดื่ม", price: 35, available: true, image: "" }
  ],
  stock: [
    { id: uid(), name: "พริกแกงไตปลา", qty: 5, unit: "กก.", cost: 190, reorder: 2 },
    { id: uid(), name: "ปลากะพง", qty: 8, unit: "กก.", cost: 220, reorder: 3 },
    { id: uid(), name: "สะตอ", qty: 12, unit: "ถุง", cost: 45, reorder: 5 },
    { id: uid(), name: "ใบเหลียง", qty: 7, unit: "มัด", cost: 35, reorder: 4 },
    { id: uid(), name: "กะปิ", qty: 4, unit: "กก.", cost: 95, reorder: 2 },
    { id: uid(), name: "ข้าวสาร", qty: 30, unit: "กก.", cost: 28, reorder: 10 }
  ],
  tickets: {},
  orders: []
};

let state = loadState();
let route = "dashboard";
let category = "ทั้งหมด";
let activeTableId = state.tables[0]?.id || "TA";
let payMethod = "เงินสด";
let menuImageDraft = "";

function uid() {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-5);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    if (!saved) {
      const fresh = clone(demo);
      fresh.activeSellerId = fresh.sellers.find((seller) => seller.active)?.id || fresh.sellers[0]?.id || "";
      return fresh;
    }
    return normalize({ ...clone(demo), ...saved });
  } catch {
    return clone(demo);
  }
}

function normalize(data) {
  data.shop = { ...clone(demo.shop), ...(data.shop || {}) };
  data.receipt = { ...clone(demo.receipt), ...(data.receipt || {}) };
  data.tables = data.tables?.length ? data.tables : clone(demo.tables);
  [
    { id: "SF", name: "ShopeeFood", online: true, platform: "ShopeeFood", color: "#ee4d2d" },
    { id: "LM", name: "LINE MAN", online: true, platform: "LINE MAN", color: "#06c755" }
  ].forEach((channel) => {
    const existing = data.tables.find((table) => table.id === channel.id);
    if (existing) Object.assign(existing, channel);
    else data.tables.push(channel);
  });
  data.sellers = (data.sellers?.length ? data.sellers : clone(demo.sellers)).map((seller) => ({ active: false, ...seller }));
  data.menu = (data.menu?.length ? data.menu : clone(demo.menu)).map((item) => ({ image: "", available: true, ...item }));
  data.stock = (data.stock?.length ? data.stock : clone(demo.stock)).map((item) => ({ cost: 0, reorder: 0, ...item }));
  data.tickets = data.tickets || {};
  data.orders = data.orders || [];
  data.activeSellerId = data.activeSellerId || data.sellers.find((seller) => seller.active)?.id || data.sellers[0]?.id || "";
  return data;
}

function saveState() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

function money(value) {
  return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(Number(value) || 0);
}

function timeText(value = new Date()) {
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}

function init() {
  bindEvents();
  setRoute(route);
}

function bindEvents() {
  $$(".nav button").forEach((button) => button.addEventListener("click", () => setRoute(button.dataset.route)));
  $$("[data-route-shortcut]").forEach((button) => button.addEventListener("click", () => setRoute(button.dataset.routeShortcut)));
  $("#searchInput").addEventListener("input", renderCurrent);
  $("#tableSelect").addEventListener("change", (event) => {
    activeTableId = event.target.value;
    renderBill();
  });
  $("#sellerSelect").addEventListener("change", (event) => {
    state.activeSellerId = event.target.value;
    saveState();
    renderSellers();
    renderHeader();
  });
  $("#discountInput").addEventListener("input", (event) => {
    getTicket().discount = Number(event.target.value) || 0;
    saveState();
    renderBill();
  });
  $("#paidInput").addEventListener("input", renderBill);
  $("#payTabs").addEventListener("click", (event) => {
    const button = event.target.closest("[data-pay]");
    if (!button) return;
    payMethod = button.dataset.pay;
    renderBill();
  });
  $("#clearBillBtn").addEventListener("click", clearBill);
  $("#checkoutBtn").addEventListener("click", checkout);
  $("#shopForm").addEventListener("submit", saveShop);
  $("#receiptForm").addEventListener("submit", saveReceipt);
  $("#newMenuBtn").addEventListener("click", () => openMenuDialog());
  $("#newStockBtn").addEventListener("click", () => openStockDialog());
  $("#newSellerBtn").addEventListener("click", () => openSellerDialog());
  $("#menuForm").addEventListener("submit", saveMenu);
  $("#stockForm").addEventListener("submit", saveStock);
  $("#sellerForm").addEventListener("submit", saveSeller);
  $$("[data-close-dialog]").forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()));
  $("#menuForm").elements.imageFile.addEventListener("change", readMenuImage);
  $("#backupBtn").addEventListener("click", backup);
  $("#restoreInput").addEventListener("change", restore);
  $("#printReportBtn").addEventListener("click", () => window.print());
}

function setRoute(next) {
  route = next;
  $$(".nav button").forEach((button) => button.classList.toggle("active", button.dataset.route === next));
  $$(".view").forEach((view) => view.classList.toggle("active", view.id === `view-${next}`));
  const meta = {
    dashboard: ["Dashboard", "สรุปยอดขายและ Stock คงเหลือ"],
    pos: ["ขายหน้าร้าน", "เลือกเมนู รับออเดอร์ และปิดบิล"],
    online: ["ออเดอร์ออนไลน์", "รับบิลจาก ShopeeFood และ LINE MAN"],
    orders: ["บิลและรายงาน", "ยอดขาย ประวัติบิล และใบเสร็จย้อนหลัง"],
    shop: ["จัดการร้านค้า", "ตั้งค่าข้อมูลร้าน ภาษี และค่าบริการ"],
    receipt: ["หัวบิล", "ตั้งค่าหัวบิลและข้อความท้ายใบเสร็จ"],
    stock: ["Stock", "วัตถุดิบ ต้นทุน มูลค่าคงเหลือ และจุดสั่งซื้อ"],
    sellers: ["ผู้ขายเข้ากะ", "จัดการพนักงานขายและกะทำงาน"],
    menu: ["จัดการเมนู", "เพิ่มเมนู ราคา หมวด และรูปอาหาร"]
  };
  $("#pageTitle").textContent = meta[next][0];
  $("#pageSubtitle").textContent = meta[next][1];
  renderCurrent();
}

function render() {
  renderHeader();
  renderCurrent();
}

function renderCurrent() {
  renderHeader();
  renderSelects();
  if (route === "dashboard") renderDashboard();
  if (route === "pos") {
    renderCategories();
    renderMenuCards();
    renderBill();
  }
  if (route === "online") renderOnline();
  if (route === "orders") renderOrders();
  if (route === "shop") renderShopForm();
  if (route === "receipt") renderReceiptForm();
  if (route === "stock") renderStock();
  if (route === "sellers") renderSellers();
  if (route === "menu") renderMenuTable();
}

function dashboardNumbers() {
  const todayOrders = state.orders.filter((order) => order.closedAt.slice(0, 10) === todayKey());
  const sales = todayOrders.reduce((sum, order) => sum + order.totals.total, 0);
  const onlineSales = todayOrders
    .filter((order) => order.channelName || ["ShopeeFood", "LINE MAN"].includes(order.tableName))
    .reduce((sum, order) => sum + order.totals.total, 0);
  const stockValue = state.stock.reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.cost) || 0), 0);
  const lowStock = state.stock.filter((item) => (Number(item.qty) || 0) <= (Number(item.reorder) || 0));
  return { todayOrders, sales, onlineSales, stockValue, lowStock };
}

function renderDashboard() {
  const { todayOrders, sales, onlineSales, stockValue, lowStock } = dashboardNumbers();
  $("#dashSales").textContent = money(sales);
  $("#dashBills").textContent = `${todayOrders.length} บิล`;
  $("#dashOnlineSales").textContent = money(onlineSales);
  $("#dashStockValue").textContent = money(stockValue);
  $("#dashStockItems").textContent = `${state.stock.length} รายการ`;
  $("#dashLowStock").textContent = lowStock.length;

  const channels = new Map();
  todayOrders.forEach((order) => {
    const key = order.channelName || order.tableName || "หน้าร้าน";
    const item = channels.get(key) || { bills: 0, sales: 0 };
    item.bills += 1;
    item.sales += order.totals.total;
    channels.set(key, item);
  });
  $("#channelSummary").innerHTML = [...channels.entries()]
    .sort((a, b) => b[1].sales - a[1].sales)
    .map(([name, item]) => `
      <div class="summary-row">
        <span>${esc(name)}<small>${item.bills} บิล</small></span>
        <strong>${money(item.sales)}</strong>
      </div>
    `).join("") || `<p class="empty">ยังไม่มียอดขายวันนี้</p>`;

  const menuMap = new Map();
  state.orders.forEach((order) => order.items.forEach((item) => {
    const row = menuMap.get(item.name) || { qty: 0, sales: 0 };
    row.qty += item.qty;
    row.sales += item.qty * item.price;
    menuMap.set(item.name, row);
  }));
  $("#bestSellerSummary").innerHTML = [...menuMap.entries()]
    .sort((a, b) => b[1].qty - a[1].qty)
    .slice(0, 6)
    .map(([name, item]) => `
      <div class="summary-row">
        <span>${esc(name)}<small>${item.qty} จาน</small></span>
        <strong>${money(item.sales)}</strong>
      </div>
    `).join("") || `<p class="empty">ยังไม่มีประวัติขาย</p>`;

  $("#dashboardStockTable").innerHTML = state.stock
    .slice()
    .sort((a, b) => {
      const alow = (Number(a.qty) || 0) <= (Number(a.reorder) || 0) ? 0 : 1;
      const blow = (Number(b.qty) || 0) <= (Number(b.reorder) || 0) ? 0 : 1;
      return alow - blow || a.name.localeCompare(b.name, "th");
    })
    .map((item) => {
      const qty = Number(item.qty) || 0;
      const reorder = Number(item.reorder) || 0;
      const cost = Number(item.cost) || 0;
      const low = qty <= reorder;
      return `
        <tr>
          <td><strong>${esc(item.name)}</strong></td>
          <td>${qty} ${esc(item.unit)}</td>
          <td>${money(cost)}</td>
          <td>${money(qty * cost)}</td>
          <td><span class="pill ${low ? "warn" : "ok"}">${low ? "ควรสั่งซื้อ" : "เพียงพอ"}</span></td>
        </tr>
      `;
    }).join("") || `<tr><td colspan="5">ยังไม่มีข้อมูล Stock</td></tr>`;
}

function renderHeader() {
  $$("[data-shop-name]").forEach((node) => node.textContent = state.shop.name);
  $$("[data-branch]").forEach((node) => node.textContent = state.shop.branch || "ระบบ POS ร้านอาหาร");
  const seller = state.sellers.find((item) => item.id === state.activeSellerId);
  $("[data-current-seller]").textContent = seller?.name || "-";
  $("[data-shift-time]").textContent = seller ? `${seller.shiftStart || "--:--"} - ${seller.shiftEnd || "--:--"}` : "-";
}

function renderSelects() {
  $("#tableSelect").innerHTML = state.tables.map((table) => `<option value="${table.id}">${esc(table.name)}</option>`).join("");
  if (!state.tables.some((table) => table.id === activeTableId)) activeTableId = state.tables[0]?.id || "";
  $("#tableSelect").value = activeTableId;
  const activeSellers = state.sellers.filter((seller) => seller.active);
  const sellerSource = activeSellers.length ? activeSellers : state.sellers;
  $("#sellerSelect").innerHTML = sellerSource.map((seller) => `<option value="${seller.id}">${esc(seller.name)}</option>`).join("");
  if (!sellerSource.some((seller) => seller.id === state.activeSellerId)) state.activeSellerId = sellerSource[0]?.id || "";
  $("#sellerSelect").value = state.activeSellerId;
}

function onlineTables() {
  const required = [
    { id: "SF", name: "ShopeeFood", online: true, platform: "ShopeeFood", color: "#ee4d2d" },
    { id: "LM", name: "LINE MAN", online: true, platform: "LINE MAN", color: "#06c755" }
  ];
  required.forEach((channel) => {
    if (!state.tables.some((table) => table.id === channel.id)) state.tables.push(channel);
  });
  return state.tables.filter((table) => table.online);
}

function renderOnline() {
  const todayOrders = state.orders.filter((order) => order.closedAt.slice(0, 10) === todayKey());
  $("#onlineChannels").innerHTML = onlineTables().map((channel) => {
    const ticket = state.tickets[channel.id];
    const orders = todayOrders.filter((order) => order.channelName === channel.platform || order.tableName === channel.name);
    const sales = orders.reduce((sum, order) => sum + order.totals.total, 0);
    return `
      <div class="online-card" style="--channel:${esc(channel.color || "#d71920")}">
        <div class="online-mark">${esc(channel.name.slice(0, 2))}</div>
        <div>
          <strong>${esc(channel.name)}</strong>
          <span>${ticket?.items.length ? `มีบิลเปิด ${ticket.items.length} รายการ` : "พร้อมรับออเดอร์"}</span>
        </div>
        <div class="online-stats">
          <div><small>บิลวันนี้</small><strong>${orders.length}</strong></div>
          <div><small>ยอดขาย</small><strong>${money(sales)}</strong></div>
        </div>
        <button class="primary" data-start-online="${channel.id}">รับออเดอร์ช่องทางนี้</button>
      </div>
    `;
  }).join("");
  $$("[data-start-online]").forEach((button) => button.addEventListener("click", () => {
    activeTableId = button.dataset.startOnline;
    payMethod = "แพลตฟอร์ม";
    getTicket();
    saveState();
    setRoute("pos");
  }));
}

function renderCategories() {
  const cats = ["ทั้งหมด", ...new Set(state.menu.map((item) => item.category).filter(Boolean))];
  if (!cats.includes(category)) category = "ทั้งหมด";
  $("#categoryTabs").innerHTML = cats.map((cat) => `<button class="${cat === category ? "active" : ""}" data-cat="${esc(cat)}">${esc(cat)}</button>`).join("");
  $$("#categoryTabs button").forEach((button) => button.addEventListener("click", () => {
    category = button.dataset.cat;
    renderCategories();
    renderMenuCards();
  }));
}

function filteredMenu() {
  const query = $("#searchInput").value.trim().toLowerCase();
  return state.menu.filter((item) => {
    const byCategory = category === "ทั้งหมด" || item.category === category;
    const bySearch = !query || `${item.name} ${item.category}`.toLowerCase().includes(query);
    return item.available && byCategory && bySearch;
  });
}

function imageHtml(item, className = "") {
  if (item.image) return `<img class="${className}" src="${item.image}" alt="${esc(item.name)}">`;
  return `<div class="${className} food-img">รูปอาหาร</div>`;
}

function renderMenuCards() {
  const items = filteredMenu();
  $("#menuCards").innerHTML = items.map((item) => `
    <button class="food-card" data-add-menu="${item.id}">
      <div class="food-img">${item.image ? `<img src="${item.image}" alt="${esc(item.name)}">` : "รูปอาหาร"}</div>
      <div class="food-body">
        <small>${esc(item.category)}</small>
        <strong>${esc(item.name)}</strong>
        <span class="price">${money(item.price)}</span>
      </div>
    </button>
  `).join("") || `<p class="empty">ไม่พบเมนู</p>`;
  $$("[data-add-menu]").forEach((button) => button.addEventListener("click", () => addToCart(button.dataset.addMenu)));
}

function getTicket() {
  if (!state.tickets[activeTableId]) {
    state.tickets[activeTableId] = {
      id: `B${Date.now().toString().slice(-8)}`,
      tableId: activeTableId,
      channelName: state.tables.find((table) => table.id === activeTableId)?.platform || "",
      sellerId: state.activeSellerId,
      discount: 0,
      items: [],
      openedAt: new Date().toISOString()
    };
  }
  state.tickets[activeTableId].sellerId = state.activeSellerId;
  state.tickets[activeTableId].channelName = state.tables.find((table) => table.id === activeTableId)?.platform || "";
  return state.tickets[activeTableId];
}

function totals(ticket = getTicket()) {
  const subtotal = ticket.items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discount = Math.min(Number(ticket.discount) || 0, subtotal);
  const base = Math.max(subtotal - discount, 0);
  const service = base * ((Number(state.shop.serviceRate) || 0) / 100);
  const tax = (base + service) * ((Number(state.shop.taxRate) || 0) / 100);
  return { subtotal, discount, service, tax, total: base + service + tax };
}

function addToCart(id) {
  const menu = state.menu.find((item) => item.id === id);
  if (!menu) return;
  const ticket = getTicket();
  const line = ticket.items.find((item) => item.menuId === id);
  if (line) line.qty += 1;
  else ticket.items.push({ menuId: id, name: menu.name, price: Number(menu.price), qty: 1 });
  saveState();
  renderBill();
}

function renderBill() {
  const ticket = getTicket();
  const total = totals(ticket);
  $("#billNo").textContent = ticket.id;
  $("#billQty").textContent = `${ticket.items.reduce((sum, item) => sum + item.qty, 0)} รายการ`;
  $("#discountInput").value = ticket.discount || 0;
  $("#cartItems").innerHTML = ticket.items.map((item, index) => `
    <div class="cart-line">
      <div><strong>${esc(item.name)}</strong><div>${money(item.price)} x ${item.qty}</div></div>
      <div>
        <strong>${money(item.price * item.qty)}</strong>
        <div class="qty">
          <button data-qty-index="${index}" data-delta="-1">-</button>
          <span>${item.qty}</span>
          <button data-qty-index="${index}" data-delta="1">+</button>
        </div>
      </div>
    </div>
  `).join("") || `<p class="empty">ยังไม่มีรายการในบิล</p>`;
  $$("[data-qty-index]").forEach((button) => button.addEventListener("click", () => changeQty(Number(button.dataset.qtyIndex), Number(button.dataset.delta))));
  $("#sumSub").textContent = money(total.subtotal);
  $("#sumService").textContent = money(total.service);
  $("#sumTax").textContent = money(total.tax);
  $("#sumTotal").textContent = money(total.total);
  $("#changeText").textContent = money(Math.max((Number($("#paidInput").value) || 0) - total.total, 0));
  $$("#payTabs button").forEach((button) => button.classList.toggle("active", button.dataset.pay === payMethod));
}

function changeQty(index, delta) {
  const ticket = getTicket();
  const item = ticket.items[index];
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) ticket.items.splice(index, 1);
  saveState();
  renderBill();
}

function clearBill() {
  const ticket = getTicket();
  if (ticket.items.length && !confirm("ล้างรายการในบิลนี้?")) return;
  delete state.tickets[activeTableId];
  saveState();
  renderBill();
}

function checkout() {
  const ticket = getTicket();
  if (!ticket.items.length) return alert("ยังไม่มีรายการในบิล");
  const total = totals(ticket);
  const paid = Number($("#paidInput").value) || total.total;
  if (payMethod === "เงินสด" && paid < total.total) return alert("ยอดรับเงินน้อยกว่ายอดสุทธิ");
  const table = state.tables.find((item) => item.id === activeTableId);
  const seller = state.sellers.find((item) => item.id === state.activeSellerId);
  const order = {
    ...clone(ticket),
    totals: total,
    paid,
    change: Math.max(paid - total.total, 0),
    tableName: table?.name || activeTableId,
    channelName: table?.platform || "",
    sellerName: seller?.name || "-",
    paymentMethod: payMethod,
    closedAt: new Date().toISOString()
  };
  state.orders.unshift(order);
  delete state.tickets[activeTableId];
  $("#paidInput").value = "";
  saveState();
  buildReceipt(order);
  renderCurrent();
  setTimeout(() => window.print(), 100);
}

function buildReceipt(order) {
  $("#printArea").innerHTML = `
    <h2>${esc(state.shop.name)}</h2>
    <div class="print-center">
      <div>${esc(state.receipt.title)}</div>
      <div>${esc(state.shop.branch || "")}</div>
      <div>${esc(state.shop.address || "")}</div>
      <div>โทร ${esc(state.shop.phone || "-")} | POS ${esc(state.receipt.posId || "-")}</div>
      <div>เลขผู้เสียภาษี ${esc(state.shop.taxId || "-")}</div>
      <div>${esc(state.receipt.headerNote || "")}</div>
    </div>
    <hr>
    <div>เลขบิล ${esc(order.id)}</div>
      <div>${esc(order.channelName || order.tableName)} | ผู้ขาย ${esc(order.sellerName)}</div>
    <div>${timeText(new Date(order.closedAt))}</div>
    <hr>
    ${order.items.map((item) => `<div class="print-row"><span>${esc(item.name)} x ${item.qty}</span><span>${money(item.price * item.qty)}</span></div>`).join("")}
    <hr>
    <div class="print-row"><span>ยอดอาหาร</span><strong>${money(order.totals.subtotal)}</strong></div>
    <div class="print-row"><span>ส่วนลด</span><strong>${money(order.totals.discount)}</strong></div>
    <div class="print-row"><span>ค่าบริการ</span><strong>${money(order.totals.service)}</strong></div>
    <div class="print-row"><span>ภาษี</span><strong>${money(order.totals.tax)}</strong></div>
    <div class="print-row"><span>รวมสุทธิ</span><strong>${money(order.totals.total)}</strong></div>
    <div class="print-row"><span>รับเงิน</span><strong>${money(order.paid)}</strong></div>
    <div class="print-row"><span>เงินทอน</span><strong>${money(order.change)}</strong></div>
    <hr>
    <div class="print-center">${esc(state.receipt.footerNote || "ขอบคุณที่อุดหนุน")}</div>
  `;
}

function renderOrders() {
  const todayOrders = state.orders.filter((order) => order.closedAt.slice(0, 10) === todayKey());
  const sales = todayOrders.reduce((sum, order) => sum + order.totals.total, 0);
  $("#kpiSales").textContent = money(sales);
  $("#kpiBills").textContent = todayOrders.length;
  $("#kpiAvg").textContent = money(todayOrders.length ? sales / todayOrders.length : 0);
  const menuMap = new Map();
  state.orders.forEach((order) => order.items.forEach((item) => menuMap.set(item.name, (menuMap.get(item.name) || 0) + item.qty)));
  const best = [...menuMap.entries()].sort((a, b) => b[1] - a[1])[0];
  $("#kpiBest").textContent = best ? best[0] : "-";
  const query = $("#searchInput").value.trim().toLowerCase();
  const orders = state.orders.filter((order) => !query || `${order.id} ${order.tableName} ${order.sellerName}`.toLowerCase().includes(query));
  $("#ordersTable").innerHTML = orders.map((order) => `
    <tr>
      <td>${timeText(new Date(order.closedAt))}</td>
      <td>${esc(order.id)}</td>
      <td>${esc(order.channelName || order.tableName)}</td>
      <td>${esc(order.sellerName)}</td>
      <td>${esc(order.paymentMethod)}</td>
      <td>${money(order.totals.total)}</td>
      <td class="row-actions"><button data-print-order="${order.id}">พิมพ์</button></td>
    </tr>
  `).join("") || `<tr><td colspan="7">ยังไม่มีประวัติบิล</td></tr>`;
  $$("[data-print-order]").forEach((button) => button.addEventListener("click", () => {
    const order = state.orders.find((item) => item.id === button.dataset.printOrder);
    buildReceipt(order);
    setTimeout(() => window.print(), 100);
  }));
}

function renderShopForm() {
  const form = $("#shopForm");
  Object.entries(state.shop).forEach(([key, value]) => {
    if (form.elements[key]) form.elements[key].value = value;
  });
}

function saveShop(event) {
  event.preventDefault();
  const form = event.currentTarget.elements;
  state.shop = {
    name: form.name.value.trim(),
    branch: form.branch.value.trim(),
    phone: form.phone.value.trim(),
    taxId: form.taxId.value.trim(),
    address: form.address.value.trim(),
    serviceRate: Number(form.serviceRate.value) || 0,
    taxRate: Number(form.taxRate.value) || 0
  };
  saveState();
  renderHeader();
  alert("บันทึกข้อมูลร้านแล้ว");
}

function renderReceiptForm() {
  const form = $("#receiptForm");
  Object.entries(state.receipt).forEach(([key, value]) => {
    if (form.elements[key]) form.elements[key].value = value;
  });
  $("#receiptPreview").innerHTML = `
    <strong>${esc(state.shop.name)}</strong><br>
    ${esc(state.receipt.title)} | ${esc(state.receipt.posId)}<br>
    ${esc(state.shop.address)}<br>
    ${esc(state.receipt.headerNote)}<hr>
    รายการอาหาร ...<br>
    <strong>รวมสุทธิ ${money(0)}</strong><hr>
    ${esc(state.receipt.footerNote)}
  `;
}

function saveReceipt(event) {
  event.preventDefault();
  const form = event.currentTarget.elements;
  state.receipt = {
    title: form.title.value.trim(),
    posId: form.posId.value.trim(),
    headerNote: form.headerNote.value.trim(),
    footerNote: form.footerNote.value.trim()
  };
  saveState();
  renderReceiptForm();
  alert("บันทึกหัวบิลแล้ว");
}

function renderStock() {
  const query = $("#searchInput").value.trim().toLowerCase();
  const items = state.stock.filter((item) => !query || item.name.toLowerCase().includes(query));
  $("#stockCards").innerHTML = items.map((item) => {
    const qty = Number(item.qty) || 0;
    const reorder = Number(item.reorder) || 0;
    const cost = Number(item.cost) || 0;
    const low = qty <= reorder;
    const max = Math.max(qty, reorder * 2, 1);
    return `
      <div class="stock-card ${low ? "low" : ""}">
        <strong>${esc(item.name)}</strong>
        <span class="pill ${low ? "warn" : "ok"}">${low ? "ควรสั่งซื้อ" : "เพียงพอ"}</span>
        <div>คงเหลือ ${qty} ${esc(item.unit)} | ขั้นต่ำ ${reorder}</div>
        <div>ต้นทุน ${money(cost)} / ${esc(item.unit)}</div>
        <div>มูลค่าคงเหลือ ${money(qty * cost)}</div>
        <div class="meter"><span style="width:${Math.min((qty / max) * 100, 100)}%"></span></div>
        <div class="row-actions">
          <button data-stock-delta="${item.id}" data-delta="-1">-1</button>
          <button data-stock-delta="${item.id}" data-delta="1">+1</button>
          <button data-edit-stock="${item.id}">แก้ไข</button>
        </div>
      </div>
    `;
  }).join("") || `<p class="empty">ยังไม่มีวัตถุดิบ</p>`;
  $$("[data-stock-delta]").forEach((button) => button.addEventListener("click", () => {
    const item = state.stock.find((stock) => stock.id === button.dataset.stockDelta);
    item.qty = Math.max(0, (Number(item.qty) || 0) + Number(button.dataset.delta));
    saveState();
    renderStock();
  }));
  $$("[data-edit-stock]").forEach((button) => button.addEventListener("click", () => openStockDialog(button.dataset.editStock)));
}

function openStockDialog(id = "") {
  const form = $("#stockForm");
  form.reset();
  form.elements.id.value = id;
  const item = state.stock.find((stock) => stock.id === id);
  if (item) Object.entries(item).forEach(([key, value]) => {
    if (form.elements[key]) form.elements[key].value = value;
  });
  $("#stockDialog").showModal();
}

function saveStock(event) {
  event.preventDefault();
  const form = event.currentTarget.elements;
  const item = {
    id: form.id.value || uid(),
    name: form.name.value.trim(),
    qty: Number(form.qty.value) || 0,
    unit: form.unit.value.trim(),
    cost: Number(form.cost.value) || 0,
    reorder: Number(form.reorder.value) || 0
  };
  upsert(state.stock, item);
  saveState();
  $("#stockDialog").close();
  renderStock();
}

function renderSellers() {
  $("#sellerCards").innerHTML = state.sellers.map((seller) => `
    <div class="seller-card">
      <strong>${esc(seller.name)}</strong>
      <span class="pill ${seller.active ? "ok" : ""}">${seller.active ? "อยู่ในกะ" : "ปิดกะ"}</span>
      <div>${esc(seller.role || "-")}</div>
      <div>${esc(seller.shiftStart || "--:--")} - ${esc(seller.shiftEnd || "--:--")}</div>
      <div class="row-actions">
        <button data-active-seller="${seller.id}">ใช้กะนี้</button>
        <button data-toggle-seller="${seller.id}">${seller.active ? "ปิดกะ" : "เปิดกะ"}</button>
        <button data-edit-seller="${seller.id}">แก้ไข</button>
      </div>
    </div>
  `).join("") || `<p class="empty">ยังไม่มีผู้ขาย</p>`;
  $$("[data-active-seller]").forEach((button) => button.addEventListener("click", () => {
    state.activeSellerId = button.dataset.activeSeller;
    saveState();
    renderHeader();
    renderSellers();
  }));
  $$("[data-toggle-seller]").forEach((button) => button.addEventListener("click", () => {
    const seller = state.sellers.find((item) => item.id === button.dataset.toggleSeller);
    seller.active = !seller.active;
    saveState();
    renderSellers();
  }));
  $$("[data-edit-seller]").forEach((button) => button.addEventListener("click", () => openSellerDialog(button.dataset.editSeller)));
}

function openSellerDialog(id = "") {
  const form = $("#sellerForm");
  form.reset();
  form.elements.id.value = id;
  const seller = state.sellers.find((item) => item.id === id);
  if (seller) Object.entries(seller).forEach(([key, value]) => {
    if (!form.elements[key]) return;
    if (form.elements[key].type === "checkbox") form.elements[key].checked = Boolean(value);
    else form.elements[key].value = value;
  });
  $("#sellerDialog").showModal();
}

function saveSeller(event) {
  event.preventDefault();
  const form = event.currentTarget.elements;
  const seller = {
    id: form.id.value || uid(),
    name: form.name.value.trim(),
    role: form.role.value.trim(),
    shiftStart: form.shiftStart.value,
    shiftEnd: form.shiftEnd.value,
    active: form.active.checked
  };
  upsert(state.sellers, seller);
  if (!state.activeSellerId) state.activeSellerId = seller.id;
  saveState();
  $("#sellerDialog").close();
  renderSellers();
  renderHeader();
}

function renderMenuTable() {
  const query = $("#searchInput").value.trim().toLowerCase();
  const items = state.menu.filter((item) => !query || `${item.name} ${item.category}`.toLowerCase().includes(query));
  $("#menuTable").innerHTML = items.map((item) => `
    <tr>
      <td>${item.image ? `<img class="thumb" src="${item.image}" alt="${esc(item.name)}">` : `<div class="thumb"></div>`}</td>
      <td><strong>${esc(item.name)}</strong></td>
      <td>${esc(item.category)}</td>
      <td>${money(item.price)}</td>
      <td>${item.available ? "เปิดขาย" : "ปิดขาย"}</td>
      <td class="row-actions">
        <button data-edit-menu="${item.id}">แก้ไข</button>
        <button data-toggle-menu="${item.id}">${item.available ? "ปิดขาย" : "เปิดขาย"}</button>
      </td>
    </tr>
  `).join("") || `<tr><td colspan="6">ยังไม่มีเมนู</td></tr>`;
  $$("[data-edit-menu]").forEach((button) => button.addEventListener("click", () => openMenuDialog(button.dataset.editMenu)));
  $$("[data-toggle-menu]").forEach((button) => button.addEventListener("click", () => {
    const item = state.menu.find((menu) => menu.id === button.dataset.toggleMenu);
    item.available = !item.available;
    saveState();
    renderMenuTable();
  }));
}

function openMenuDialog(id = "") {
  const form = $("#menuForm");
  form.reset();
  menuImageDraft = "";
  $("#menuImagePreview").style.display = "none";
  form.elements.id.value = id;
  const item = state.menu.find((menu) => menu.id === id);
  if (item) {
    Object.entries(item).forEach(([key, value]) => {
      if (!form.elements[key]) return;
      if (form.elements[key].type === "checkbox") form.elements[key].checked = Boolean(value);
      else form.elements[key].value = value;
    });
    menuImageDraft = item.image || "";
    if (menuImageDraft) {
      $("#menuImagePreview").src = menuImageDraft;
      $("#menuImagePreview").style.display = "block";
    }
  } else {
    form.elements.available.checked = true;
  }
  $("#menuDialog").showModal();
}

function readMenuImage(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 1024 * 1024 * 2) {
    alert("แนะนำใช้รูปไม่เกิน 2 MB");
  }
  const reader = new FileReader();
  reader.onload = () => {
    menuImageDraft = reader.result;
    $("#menuImagePreview").src = menuImageDraft;
    $("#menuImagePreview").style.display = "block";
  };
  reader.readAsDataURL(file);
}

function saveMenu(event) {
  event.preventDefault();
  const form = event.currentTarget.elements;
  const oldItem = state.menu.find((item) => item.id === form.id.value);
  const item = {
    id: form.id.value || uid(),
    name: form.name.value.trim(),
    category: form.category.value.trim(),
    price: Number(form.price.value) || 0,
    available: form.available.checked,
    image: menuImageDraft || oldItem?.image || ""
  };
  upsert(state.menu, item);
  saveState();
  $("#menuDialog").close();
  renderMenuTable();
  if (route === "pos") renderMenuCards();
}

function upsert(list, item) {
  const index = list.findIndex((entry) => entry.id === item.id);
  if (index >= 0) list[index] = item;
  else list.push(item);
}

function backup() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `southern-pos-backup-${todayKey()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function restore(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      state = normalize(JSON.parse(reader.result));
      saveState();
      render();
      alert("นำเข้าข้อมูลสำเร็จ");
    } catch {
      alert("ไฟล์ข้อมูลไม่ถูกต้อง");
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

init();
