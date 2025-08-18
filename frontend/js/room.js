function getParam(name) {
  const url = new URL(location.href);
  return url.searchParams.get(name);
}
function renderRoom(r) {
  const wrap = qs("#room-detail");
  if (!r) {
    wrap.innerHTML = "<p>Không tìm thấy phòng.</p>";
    return;
  }
  const img = r.images && r.images[0] ? r.images[0] : "assets/placeholder.svg";
  wrap.innerHTML = `
  <div class="card">
    <img src="${img}" alt="${r.title}">
    <div class="body">
      <h2 style="margin:.3rem 0">${r.title}</h2>
      <div class="badge">${r.location}</div>
      <div class="badge">${r.status}</div>
      <div style="font-weight:700;margin-top:.25rem">${fmtVND(
        r.price
      )}/tháng</div>
      <p style="color:var(--muted);margin:.5rem 0 1rem">${r.description}</p>
      <div id="request-area"></div>
    </div>
  </div>`;
  const u = currentUser();
  const area = qs("#request-area");
  if (!u) {
    area.innerHTML = `<a class="btn" href="login.html?next=${encodeURIComponent(
      location.pathname + location.search
    )}">Đăng nhập để gửi yêu cầu thuê</a>`;
  } else if (u.role !== "tenant") {
    area.innerHTML = `<p class="help">Bạn đang đăng nhập là <b>${u.role}</b>. Chỉ người thuê mới gửi yêu cầu.</p>`;
  } else {
    area.innerHTML = `
    <form id="reqForm">
      <label>Lời nhắn cho chủ nhà</label>
      <textarea class="input" id="message" rows="3" placeholder="Mình muốn xem phòng vào cuối tuần..."></textarea>
      <button class="btn" type="submit">Gửi yêu cầu thuê</button>
    </form>
    <p class="help">Yêu cầu sẽ xuất hiện trong Dashboard của bạn và Admin.</p>`;
    qs("#reqForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const msg = qs("#message").value.trim();
      const reqs = getRequests();
      reqs.push({
        id: uid(),
        roomId: r.id,
        tenantId: u.id,
        message: msg,
        status: "pending",
        createdAt: new Date().toISOString(),
      });
      setRequests(reqs);
      alert("Đã gửi yêu cầu!");
      window.location.href = "dashboard.html";
    });
  }
}
document.addEventListener("DOMContentLoaded", () => {
  const id = getParam("id");
  const r = getRooms().find((x) => x.id === id);
  renderRoom(r);
});
