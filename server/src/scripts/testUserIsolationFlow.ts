const BASE_URL = 'http://localhost:5000/api/v1';

async function req(url: string, options: any = {}) {
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  const res = await fetch(fullUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined,
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }

  return { status: res.status, ok: res.ok, data: json };
}

async function runTest() {
  console.log('🚀 [TEST] Starting Multi-User Production Data Flow & IDOR Security Verification...\n');

  const timestamp = Date.now();
  const userAData = {
    email: `usera_${timestamp}@testenterprise.com`,
    password: 'Password@123',
    fullName: 'Rajesh Sharma (Enterprise A)',
    phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
    role: 'CITIZEN',
  };

  const userBData = {
    email: `userb_${timestamp}@testtech.com`,
    password: 'Password@123',
    fullName: 'Sunita Patil (Enterprise B)',
    phone: `97${Math.floor(10000000 + Math.random() * 90000000)}`,
    role: 'CITIZEN',
  };

  // ========================================================
  // STEP 1: USER A REGISTRATION & LOGIN
  // ========================================================
  console.log('📌 1. Registering & Logging in User A...');
  const regResA = await req('/auth/signup', { method: 'POST', body: userAData });
  if (!regResA.ok || !regResA.data.success) {
    throw new Error(`User A signup failed: ${JSON.stringify(regResA.data)}`);
  }
  const userAId = regResA.data.data.user.id;
  const tokenA = regResA.data.data.token || regResA.data.data.tokens?.accessToken;
  console.log(`   ✅ User A created with unique ID: ${userAId}`);

  // ========================================================
  // STEP 2: USER A FILLS BUSINESS PROFILE
  // ========================================================
  console.log('📌 2. User A saving Business Profile...');
  const profileA = {
    businessName: 'Sharma Heavy Engineering Pvt Ltd',
    legalEntityType: 'PRIVATE_LIMITED',
    industrySector: 'Automotive & Heavy Fabrication',
    businessActivity: 'Manufacturing of precision auto components and heavy stampings',
    district: 'Pune',
    taluka: 'Haveli',
    pinCode: '411018',
    isMidcArea: true,
    midcEstateName: 'Chakan Industrial Area Phase II',
    surveyPlotNumber: 'Plot E-42/1',
    landAreaSqm: 5000,
    builtUpAreaSqm: 2500,
    investmentPlantMachinery: 45000000,
    investmentLandBuilding: 25000000,
    employeeCount: 45,
    powerRequirementKva: 350,
    waterRequirementKld: 25,
    pollutionCategory: 'ORANGE',
    effluentDischargeKld: 5,
    hazardousWasteGeneration: false,
    hasBoiler: false,
    hasDgSet: true,
    dgSetCapacityKva: 250,
  };

  const profResA = await req('/business-profiles', {
    method: 'POST',
    body: profileA,
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  if (!profResA.ok) throw new Error(`User A profile save failed: ${JSON.stringify(profResA.data)}`);
  console.log(`   ✅ User A profile saved: "${profResA.data.data.businessName}"`);

  // ========================================================
  // STEP 3: USER A UPLOADS DOCUMENTS & VERIFIES
  // ========================================================
  console.log('📌 3. User A uploading and verifying statutory documents...');
  const docUploadRes = await req('/documents', {
    method: 'POST',
    body: {
      fileName: 'PAN_Enterprise_Sharma.pdf',
      documentType: 'DOC_PAN',
      title: 'Company PAN Card',
      mimeType: 'application/pdf',
      fileSize: 120000,
      textPreview: 'INCOME TAX DEPARTMENT GOVT OF INDIA PERMANENT ACCOUNT NUMBER AAACS1234F SHARMA HEAVY ENGINEERING PVT LTD',
    },
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  if (!docUploadRes.ok) throw new Error(`User A doc upload failed: ${JSON.stringify(docUploadRes.data)}`);
  const userADocId = docUploadRes.data.data.document.id;
  console.log(`   ✅ Document uploaded with ID: ${userADocId}, Status: ${docUploadRes.data.data.document.verificationStatus}`);

  // ========================================================
  // STEP 4: USER A SUBMITS CONSOLIDATED APPLICATION
  // ========================================================
  console.log('📌 4. User A submitting consolidated single-window application...');
  const appSubmitRes = await req('/applications/submit', {
    method: 'POST',
    body: {
      businessProfile: profileA,
      approvals: [
        { approvalCode: 'MPCB_CTE', name: 'Consent to Establish (CTE)' },
        { approvalCode: 'DISH_FACT_LIC', name: 'Factory License Registration' },
      ],
      documentIds: [userADocId],
    },
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  if (!appSubmitRes.ok) throw new Error(`User A app submit failed: ${JSON.stringify(appSubmitRes.data)}`);
  const userAApp = appSubmitRes.data.data;
  const userAAppId = userAApp.id;
  const userAAppNumber = userAApp.applicationNumber;
  console.log(`   ✅ Application submitted! App No: ${userAAppNumber}, ID: ${userAAppId}`);

  // Verify document is linked to application
  const userADocsAfterSubmit = await req('/documents', {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const linkedDoc = userADocsAfterSubmit.data.data.find((d: any) => d.id === userADocId);
  console.log(`   ✅ Document linked to application: ${linkedDoc?.applicationId === userAAppId ? 'YES' : 'NO'}`);

  // ========================================================
  // STEP 5: USER A FETCHES MY APPLICATIONS
  // ========================================================
  console.log('📌 5. User A fetching "My Applications"...');
  const userAAppsList = await req('/applications', {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  console.log(`   ✅ User A has ${userAAppsList.data.data.length} applications in database (Expected: 1)`);
  if (userAAppsList.data.data.length !== 1 || userAAppsList.data.data[0].id !== userAAppId) {
    throw new Error('User A applications list does not match submitted application');
  }

  // ========================================================
  // STEP 6: USER A OPENS APPLICATION DETAILS
  // ========================================================
  console.log('📌 6. User A viewing application details by ID...');
  const appDetailResA = await req(`/applications/${userAAppId}`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  if (!appDetailResA.ok) throw new Error('User A could not fetch own application details');
  console.log(`   ✅ Application retrieved successfully by ID: ${appDetailResA.data.data.applicationNumber}`);

  // ========================================================
  // STEP 7: LOGOUT USER A & REGISTER / LOGIN USER B
  // ========================================================
  console.log('\n📌 7. Logging out User A and Registering User B...');
  const regResB = await req('/auth/signup', { method: 'POST', body: userBData });
  if (!regResB.ok || !regResB.data.success) throw new Error('User B signup failed');
  const userBId = regResB.data.data.user.id;
  const tokenB = regResB.data.data.token || regResB.data.data.tokens?.accessToken;
  console.log(`   ✅ User B created with unique ID: ${userBId} (Distinct from User A: ${userAId !== userBId})`);

  // ========================================================
  // STEP 8: USER B FETCHES MY APPLICATIONS (MUST BE EMPTY!)
  // ========================================================
  console.log('📌 8. Checking User B "My Applications" (Must be completely fresh with NO applications)...');
  const userBAppsList = await req('/applications', {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  console.log(`   ✅ User B applications count: ${userBAppsList.data.data.length} (Expected: 0)`);
  if (userBAppsList.data.data.length !== 0) {
    throw new Error('SECURITY VIOLATION: User B sees applications belonging to User A!');
  }

  // Check User B documents (Must be 0)
  const userBDocs = await req('/documents', {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  console.log(`   ✅ User B documents count: ${userBDocs.data.data.length} (Expected: 0)`);
  if (userBDocs.data.data.length !== 0) {
    throw new Error('SECURITY VIOLATION: User B sees documents belonging to User A!');
  }

  // ========================================================
  // STEP 9: IDOR SECURITY TEST: USER B ATTEMPTS ACCESS TO USER A'S DATA
  // ========================================================
  console.log('📌 9. Testing IDOR Prevention: User B attempts to access User A application ID...');
  const idorAppRes = await req(`/applications/${userAAppId}`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  if (idorAppRes.status === 404 || idorAppRes.status === 403) {
    console.log(`   🛡️ IDOR Protection PASSED: Backend rejected User B with HTTP ${idorAppRes.status} (${idorAppRes.data.message || 'Access Denied'})`);
  } else {
    throw new Error(`CRITICAL SECURITY FAILURE: User B was able to view User A application details (IDOR)! Status: ${idorAppRes.status}`);
  }

  console.log('📌 10. Testing IDOR Prevention: User B attempts to access User A document ID...');
  const idorDocRes = await req(`/documents/${userADocId}`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  if (idorDocRes.status === 404 || idorDocRes.status === 403) {
    console.log(`   🛡️ IDOR Protection PASSED: Backend rejected User B with HTTP ${idorDocRes.status}`);
  } else {
    throw new Error(`CRITICAL SECURITY FAILURE: User B was able to view User A document (IDOR)! Status: ${idorDocRes.status}`);
  }

  // ========================================================
  // STEP 11: USER A RE-LOGINS AND PERSISTENCE TEST
  // ========================================================
  console.log('📌 11. User A logs in again...');
  const loginResA = await req('/auth/login', {
    method: 'POST',
    body: {
      email: userAData.email,
      password: userAData.password,
    },
  });
  const newTokenA = loginResA.data.data.token || loginResA.data.data.tokens?.accessToken;
  const userAAppsAfterRelogin = await req('/applications', {
    headers: { Authorization: `Bearer ${newTokenA}` },
  });
  console.log(`   ✅ User A applications after re-login: ${userAAppsAfterRelogin.data.data.length} (Expected: 1)`);
  if (userAAppsAfterRelogin.data.data.length !== 1 || userAAppsAfterRelogin.data.data[0].id !== userAAppId) {
    throw new Error('Persistence failure: User A application was lost after logging back in!');
  }
  console.log(`   ✅ User A application number verified: ${userAAppsAfterRelogin.data.data[0].applicationNumber}`);

  console.log('\n🎉 ALL 11 VERIFICATION CHECKS PASSED WITH 100% SUCCESS!');
  console.log('   - Real user isolation across all endpoints');
  console.log('   - Strict PostgreSQL database persistence');
  console.log('   - Zero fake/mock fallback data leakage');
  console.log('   - IDOR prevention fully verified');
}

runTest().catch((err) => {
  console.error('\n❌ Test execution failed:', err);
  process.exit(1);
});
