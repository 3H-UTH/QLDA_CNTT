// Test file để kiểm tra logic xử lý hợp đồng ACTIVE

// Mock data để test
const mockRequests = [
  { id: 1, status: 'PENDING', room: 101, tenant_name: 'Nguyễn A' },
  { id: 2, status: 'ACCEPTED', room: 102, tenant_name: 'Trần B' },
  { id: 3, status: 'PENDING', room: 103, tenant_name: 'Lê C' },
];

const mockContracts = [
  { id: 1, rental_request: 1, status: 'ACTIVE', tenant: 10 },
  { id: 2, rental_request: 2, status: 'DRAFT', tenant: 11 },
];

// Test function kiểm tra trạng thái
function testContractLogic() {
  console.log('=== Test Contract Logic ===');
  
  mockRequests.forEach(request => {
    // Kiểm tra xem request có hợp đồng ACTIVE không
    const activeContract = mockContracts.find(c => 
      c.rental_request === request.id && c.status === 'ACTIVE'
    );
    
    const hasActiveContract = !!activeContract;
    const finalStatus = hasActiveContract ? 'CONTRACTED' : request.status;
    
    console.log(`Request ${request.id}:`);
    console.log(`  - Original status: ${request.status}`);
    console.log(`  - Has active contract: ${hasActiveContract}`);
    console.log(`  - Final display status: ${finalStatus}`);
    console.log(`  - Show "Lập hợp đồng" button: ${!hasActiveContract && (request.status === 'PENDING' || request.status === 'ACCEPTED')}`);
    console.log('---');
  });
}

// Chạy test
testContractLogic();

// Expected output:
// Request 1: PENDING -> CONTRACTED (có hợp đồng ACTIVE), ẩn nút "Lập hợp đồng"  
// Request 2: ACCEPTED -> ACCEPTED (chưa có hợp đồng ACTIVE), hiện nút "Lập hợp đồng"
// Request 3: PENDING -> PENDING (chưa có hợp đồng ACTIVE), hiện nút "Lập hợp đồng"
