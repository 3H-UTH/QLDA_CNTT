
document.addEventListener('DOMContentLoaded',()=>{
  const u=requireAuth(['admin']); if(!u) return;
  function refreshRooms(){
    const list=getRooms(); const tbody=qs('#room-tbody');
    tbody.innerHTML=list.map(r=>`
      <tr>
        <td>${r.title}</td><td>${r.location}</td><td>${fmtVND(r.price)}</td>
        <td><span class="badge">${r.status}</span></td>
        <td>
          <a class="btn secondary" href="room.html?id=${r.id}">Xem</a>
          <button class="btn secondary btn-edit" data-id="${r.id}">Sửa</button>
          <button class="btn danger btn-del" data-id="${r.id}">Xoá</button>
        </td>
      </tr>`).join('');
    qsa('.btn-del').forEach(b=>b.addEventListener('click',()=>{
      const id=b.getAttribute('data-id'); setRooms(getRooms().filter(x=>x.id!==id)); refreshRooms();
    }));
    qsa('.btn-edit').forEach(b=>b.addEventListener('click',()=>{
      const id=b.getAttribute('data-id'); const r=getRooms().find(x=>x.id===id); if(!r) return;
      qs('#roomId').value=r.id; qs('#title').value=r.title; qs('#location').value=r.location;
      qs('#price').value=r.price; qs('#status').value=r.status; qs('#description').value=r.description;
    }));
  }
  qs('#roomForm').addEventListener('submit',e=>{
    e.preventDefault();
    const id=qs('#roomId').value||uid();
    const item={ id, title:qs('#title').value.trim(), location:qs('#location').value.trim(),
      price:parseInt(qs('#price').value||'0',10), status:qs('#status').value,
      description:qs('#description').value.trim(), images:['assets/placeholder.svg'], landlordId:u.id };
    const list=getRooms(); const idx=list.findIndex(x=>x.id===id); if(idx>=0) list[idx]=item; else list.push(item);
    setRooms(list); e.target.reset(); refreshRooms();
  });
  refreshRooms();

  function refreshRequests(){
    const reqs=getRequests().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)); const tbody=qs('#req-tbody');
    if(reqs.length===0){ tbody.innerHTML='<tr><td colspan="6" class="help">Chưa có yêu cầu.</td></tr>'; return; }
    tbody.innerHTML=reqs.map(r=>{
      const room=getRooms().find(x=>x.id===r.roomId); const tenant=getUsers().find(x=>x.id===r.tenantId);
      return `<tr>
        <td>${room?room.title:r.roomId}</td>
        <td>${tenant?tenant.fullName:r.tenantId} (${tenant?tenant.email:''})</td>
        <td>${r.message||''}</td>
        <td>${new Date(r.createdAt).toLocaleString('vi-VN')}</td>
        <td><span class="badge">${r.status}</span></td>
        <td>${r.status==='pending'?
            '<button class="btn btn-approve" data-id="'+r.id+'">Duyệt</button> <button class="btn secondary btn-reject" data-id="'+r.id+'">Từ chối</button>'
            :''}</td>
      </tr>`;
    }).join('');
    qsa('.btn-approve').forEach(b=>b.addEventListener('click',()=>handleApprove(b.getAttribute('data-id'))));
    qsa('.btn-reject').forEach(b=>b.addEventListener('click',()=>handleReject(b.getAttribute('data-id'))));
  }
  function handleApprove(id){
    const reqs=getRequests(); const i=reqs.findIndex(x=>x.id===id); if(i<0) return; reqs[i].status='approved'; setRequests(reqs);
    const room=getRooms().find(x=>x.id===reqs[i].roomId); const start=new Date().toISOString().slice(0,10);
    const cts=getContracts(); cts.push({ id:uid(), roomId:reqs[i].roomId, tenantId:reqs[i].tenantId, startDate:start, endDate:'', status:'active', monthlyRent:room?room.price:0 });
    setContracts(cts); alert('Đã duyệt và tạo hợp đồng!'); refreshRequests(); refreshContracts();
  }
  function handleReject(id){
    const reqs=getRequests(); const i=reqs.findIndex(x=>x.id===id); if(i<0) return; reqs[i].status='rejected'; setRequests(reqs); refreshRequests();
  }
  refreshRequests();

  function refreshContracts(){
    const cts=getContracts(); const tbody=qs('#contract-tbody');
    if(cts.length===0){ tbody.innerHTML='<tr><td colspan="6" class="help">Chưa có hợp đồng.</td></tr>'; return; }
    tbody.innerHTML=cts.map(c=>{
      const room=getRooms().find(x=>x.id===c.roomId); const tenant=getUsers().find(x=>x.id===c.tenantId);
      return `<tr>
        <td>${room?room.title:c.roomId}</td>
        <td>${tenant?tenant.fullName:c.tenantId}</td>
        <td>${fmtVND(c.monthlyRent)}</td>
        <td>${c.startDate} → ${c.endDate||'-'}</td>
        <td><span class="badge">${c.status}</span></td>
        <td>${c.status==='active'?'<button class="btn secondary btn-complete" data-id="'+c.id+'">Kết thúc</button>':''}</td>
      </tr>`;
    }).join('');
    qsa('.btn-complete').forEach(b=>b.addEventListener('click',()=>{
      const id=b.getAttribute('data-id'); const list=getContracts(); const i=list.findIndex(x=>x.id===id);
      if(i>=0){ list[i].status='completed'; list[i].endDate=new Date().toISOString().slice(0,10); setContracts(list); refreshContracts(); }
    }));
  }
  refreshContracts();
});
