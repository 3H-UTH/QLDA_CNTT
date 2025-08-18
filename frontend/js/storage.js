const LS_KEYS = {
  USERS: "rf_users",
  ROOMS: "rf_rooms",
  CONTRACTS: "rf_contracts",
  REQUESTS: "rf_requests",
  SESSION: "rf_session",
};
const db = {
  read: (k) => JSON.parse(localStorage.getItem(k) || "[]"),
  write: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
  getSession: () => JSON.parse(localStorage.getItem(LS_KEYS.SESSION) || "null"),
  setSession: (s) => localStorage.setItem(LS_KEYS.SESSION, JSON.stringify(s)),
  clearSession: () => localStorage.removeItem(LS_KEYS.SESSION),
};
function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
function seedIfEmpty() {
  const u = db.read(LS_KEYS.USERS);
  if (u.length === 0) {
    const adminId = uid(),
      tenantId = uid();
    db.write(LS_KEYS.USERS, [
      {
        id: adminId,
        role: "admin",
        fullName: "Admin User",
        email: "admin@example.com",
        password: "Admin12345!",
        phone: "0900000000",
      },
      {
        id: tenantId,
        role: "tenant",
        fullName: "Minh Huy",
        email: "huy@example.com",
        password: "Huy12345!",
        phone: "0901234567",
      },
    ]);
    const r1 = {
      id: uid(),
      title: "Phòng trọ Q.7 - gần ĐH Tôn Đức Thắng",
      location: "Quận 7, TP.HCM",
      price: 2800000,
      description: "Phòng mới, có ban công, giờ giấc tự do.",
      status: "available",
      images: ["assets/placeholder.svg"],
      landlordId: adminId,
    };
    const r2 = {
      id: uid(),
      title: "Nhà nguyên căn Q.9 - 2PN",
      location: "TP. Thủ Đức (Q.9 cũ)",
      price: 6500000,
      description: "Nhà 2 phòng ngủ, gần VinUni.",
      status: "available",
      images: ["assets/placeholder.svg"],
      landlordId: adminId,
    };
    const r3 = {
      id: uid(),
      title: "Phòng trọ Q.4 - hẻm rộng",
      location: "Quận 4, TP.HCM",
      price: 2300000,
      description: "Hẻm xe hơi, WC riêng.",
      status: "occupied",
      images: ["assets/placeholder.svg"],
      landlordId: adminId,
    };
    db.write(LS_KEYS.ROOMS, [r1, r2, r3]);
    db.write(LS_KEYS.CONTRACTS, []);
    db.write(LS_KEYS.REQUESTS, []);
  }
}
seedIfEmpty();
function getUsers() {
  return db.read(LS_KEYS.USERS);
}
function setUsers(v) {
  db.write(LS_KEYS.USERS, v);
}
function getRooms() {
  return db.read(LS_KEYS.ROOMS);
}
function setRooms(v) {
  db.write(LS_KEYS.ROOMS, v);
}
function getContracts() {
  return db.read(LS_KEYS.CONTRACTS);
}
function setContracts(v) {
  db.write(LS_KEYS.CONTRACTS, v);
}
function getRequests() {
  return db.read(LS_KEYS.REQUESTS);
}
function setRequests(v) {
  db.write(LS_KEYS.REQUESTS, v);
}
