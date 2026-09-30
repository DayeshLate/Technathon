const BASE_URL = 'http://localhost:5000/api';

async function testEndpoint(name, url, options = {}) {
  try {
    const res = await fetch(url, options);
    const data = await res.json();
    if (res.ok && data.success !== false) {
      console.log(`✅ [PASS] ${name} (${res.status})`);
      return data;
    } else {
      console.error(`❌ [FAIL] ${name} (${res.status}):`, data);
      return null;
    }
  } catch (err) {
    console.error(`❌ [ERROR] ${name}:`, err.message);
    return null;
  }
}

async function runTests() {
  console.log('🧪 Starting Red Relay Backend API Test Suite...\n');

  // 1. Health
  await testEndpoint('Health Check', `${BASE_URL}/health`);

  // 2. Hospitals
  const hospData = await testEndpoint('List Hospitals', `${BASE_URL}/hospitals`);
  if (hospData?.data?.length > 0) {
    await testEndpoint('Get Hospital By ID', `${BASE_URL}/hospitals/${hospData.data[0].id}`);
  }

  // 3. Blood Banks & Aggregates
  await testEndpoint('List Blood Banks', `${BASE_URL}/blood-banks`);
  await testEndpoint('Inventory Aggregates', `${BASE_URL}/blood-banks/inventory/aggregates`);

  // 4. Donors
  const donorData = await testEndpoint('List Donors', `${BASE_URL}/donors?bloodGroup=O-`);
  if (donorData?.data?.length > 0) {
    const dId = donorData.data[0].id;
    await testEndpoint('Get Donor Detail', `${BASE_URL}/donors/${dId}`);
    await testEndpoint('Toggle Availability', `${BASE_URL}/donors/${dId}/availability`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ available: true })
    });
  }

  // 5. Smart Matching Engine
  await testEndpoint('AI Donor Matching', `${BASE_URL}/matching/find-donors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bloodGroup: 'O-',
      urgency: 'Critical',
      latitude: 19.0514,
      longitude: 72.8295,
      limit: 5
    })
  });

  // 6. Duplicate Fraud Detection
  await testEndpoint('Fraud Check Duplicate', `${BASE_URL}/fraud/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patientCaseId: 'PT-99420-duplicate-test',
      bloodGroup: 'O-',
      hospitalId: 'H1',
      unitsRequired: 4
    })
  });

  // 7. Create Emergency Request
  const newReqData = await testEndpoint('Create Emergency Request', `${BASE_URL}/requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      hospitalId: 'H1',
      patientCaseId: 'PT-TEST-2026',
      bloodGroup: 'O-',
      unitsRequired: 3,
      urgency: 'Critical',
      requiredByMinutes: 35,
      notes: 'Automated test emergency trauma transfusion.'
    })
  });

  const createdId = newReqData?.data?.id;
  if (createdId) {
    await testEndpoint('Get Created Request Details', `${BASE_URL}/requests/${createdId}`);
    await testEndpoint('Update Request Status', `${BASE_URL}/requests/${createdId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'DONORS_IDENTIFIED' })
    });
  }

  // 8. NGOs
  await testEndpoint('List NGOs', `${BASE_URL}/ngos`);

  // 9. Analytics Overview
  await testEndpoint('Analytics Overview', `${BASE_URL}/analytics/overview`);

  // 10. Notifications
  await testEndpoint('List Notifications', `${BASE_URL}/notifications`);

  // 11. Guided Demo Execution
  await testEndpoint('Guided Demo Step 5', `${BASE_URL}/demo/execute/5`, {
    method: 'POST'
  });

  console.log('\n🎉 Test Suite Execution Completed!');
}

runTests();
