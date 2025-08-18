document.addEventListener("DOMContentLoaded", () => {
  const u = requireAuth(["tenant"]);
  if (!u) return;
  const myReqs = getRequests()
    .filter((x) => x.tenantId === u.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const reqTbody = qs("#req-tbody");
  if (myReqs.length === 0) {
    reqTbody.innerHTML =
      '<tr><td colspan="5" class="help">Chưa có yêu cầu nào.</td></tr>';
  } else {
    reqTbody.innerHTML = myReqs
      .map((r) => {
        const room = getRooms().find((x) => x.id === r.roomId);
        return `<tr>
        <td>${room ? room.title : r.roomId}</td>
        <td>${r.message || ""}</td>
        <td>${new Date(r.createdAt).toLocaleString("vi-VN")}</td>
        <td><span class="badge">${r.status}</span></td>
        <td>${
          r.status === "pending"
            ? '<button class="btn secondary btn-cancel" data-id="' +
              r.id +
              '">Hủy</button>'
            : ""
        }</td>
      </tr>`;
      })
      .join("");
  }
  qsa(".btn-cancel").forEach((btn) =>
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const list = getRequests().filter((x) => x.id !== id);
      setRequests(list);
      location.reload();
    })
  );

  const myContracts = getContracts().filter((c) => c.tenantId === u.id);
  const cTbody = qs("#contract-tbody");
  if (myContracts.length === 0) {
    cTbody.innerHTML =
      '<tr><td colspan="6" class="help">Chưa có hợp đồng nào.</td></tr>';
  } else {
    cTbody.innerHTML = myContracts
      .map((c) => {
        const room = getRooms().find((x) => x.id === c.roomId);
        return `<tr>
        <td>${room ? room.title : c.roomId}</td>
        <td>${fmtVND(c.monthlyRent)}</td>
        <td>${c.startDate} → ${c.endDate || "-"}</td>
        <td><span class="badge">${c.status}</span></td>
        <td><a class="btn secondary" href="room.html?id=${
          c.roomId
        }">Xem phòng</a></td>
        <td></td>
      </tr>`;
      })
      .join("");
  }

  qs("#fullName").value = u.fullName || "";
  qs("#phone").value = u.phone || "";
  qs("#email").value = u.email || "";
  qs("#profileForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const users = getUsers();
    const i = users.findIndex((x) => x.id === u.id);
    if (i >= 0) {
      users[i].fullName = qs("#fullName").value.trim();
      users[i].phone = qs("#phone").value.trim();
      setUsers(users);
      db.setSession({
        id: users[i].id,
        role: users[i].role,
        fullName: users[i].fullName,
        email: users[i].email,
        phone: users[i].phone,
      });
      alert("Đã cập nhật hồ sơ");
      renderNavbar();
    }
  });
});
