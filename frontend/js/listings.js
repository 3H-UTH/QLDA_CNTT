function renderRooms(rooms) {
  const wrap = document.getElementById("room-list");
  wrap.innerHTML = "";
  if (rooms.length === 0) {
    wrap.innerHTML = '<p class="help">Không có phòng phù hợp.</p>';
    return;
  }
  rooms.forEach((r) => {
    const div = document.createElement("div");
    div.className = "card";
    const img =
      r.images && r.images[0] ? r.images[0] : "assets/placeholder.svg";
    div.innerHTML = `
      <img src="${img}" alt="${r.title}">
      <div class="body">
        <h3 style="margin:.2rem 0">${r.title}</h3>
        <div class="badge">${r.location}</div>
        <div class="badge">${r.status}</div>
        <div style="font-weight:700;margin-top:.25rem">${fmtVND(
          r.price
        )}/tháng</div>
        <p style="color:var(--muted);margin:.3rem 0 .6rem">${r.description.substring(
          0,
          120
        )}...</p>
        <a class="btn" href="room.html?id=${r.id}">Xem chi tiết</a>
      </div>`;
    wrap.appendChild(div);
  });
}
function applySearch() {
  const kw = qs("#kw").value.trim().toLowerCase();
  const loc = qs("#location").value.trim().toLowerCase();
  const min = parseInt(qs("#priceMin").value || "0", 10);
  const max = parseInt(qs("#priceMax").value || "0", 10);
  let rooms = getRooms();
  rooms = rooms.filter((r) => {
    const okKw =
      !kw ||
      r.title.toLowerCase().includes(kw) ||
      r.description.toLowerCase().includes(kw);
    const okLoc = !loc || r.location.toLowerCase().includes(loc);
    const okMin = !min || r.price >= min;
    const okMax = !max || r.price <= max;
    return okKw && okLoc && okMin && okMax;
  });
  renderRooms(rooms);
}
document.addEventListener("DOMContentLoaded", () => {
  renderRooms(getRooms());
  qs("#searchForm").addEventListener("submit", (e) => {
    e.preventDefault();
    applySearch();
  });
});
