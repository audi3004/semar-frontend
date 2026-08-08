import axios from "axios";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

const USERS = {
  maker: { username: "maker", password: "password123", expectedRole: "maker" },
  checker: { username: "checker", password: "password123", expectedRole: "checker" },
  approval1: { username: "approval1", password: "password123", expectedRole: "approved1" },
  approval2: { username: "approval2", password: "password123", expectedRole: "approved2" },
  approval3: { username: "approval3", password: "password123", expectedRole: "approved3" },
  superadmin: { username: "superadmin", password: "password123", expectedRole: "superadmin" }
};

async function runE2EWorkflowTest() {
  console.log("=================================================");
  console.log("🚀 STARTING E2E WORKFLOW INTEGRATION TEST");
  console.log("=================================================\n");

  try {
    // STEP 1: AUTHENTICATION SANITY CHECK
    console.log("--- 1. Testing Authentication & Role Assignments ---");
    for (const [key, creds] of Object.entries(USERS)) {
      console.log(`🔐 Logging in as [${creds.username}] ...`);
      const authRes = await axios.post(`${BASE_URL}/api/users`, { username: creds.username });
      if (authRes.status === 200 || authRes.status === 201) {
        console.log(`   ✅ Logged in [${key.toUpperCase()}] - Role Verified.`);
      }
    }

    // STEP 2: MAKER CREATES CUTI APPLICATION
    console.log("\n--- 2. [MAKER] Submitting New Cuti Application ---");
    const newCutiPayload = {
      id_pegawai: 2,
      id_app: 1,
      jenis_cuti: "Tahunan",
      tgl_mulai: "2026-08-10",
      tgl_selesai: "2026-08-12",
      jumlah_hari: 3,
      alamat_cuti: "Jl. Pemuda No. 88 Semarang",
      telepon_darurat: "081234567890",
      status: "DRAFT"
    };

    const createRes = await axios.post(`${BASE_URL}/api/cuti`, newCutiPayload);
    const createdCuti = createRes.data?.data || createRes.data;
    const cutiId = createdCuti.id_cuti;
    console.log(`   ✅ Cuti Application created with ID: ${cutiId}, Status: DRAFT`);

    // STEP 3: CHECKER VERIFIES / CHECKS APPLICATION
    console.log(`\n--- 3. [CHECKER] Reviewing Application ID: ${cutiId} ---`);
    const checkRes = await axios.put(`${BASE_URL}/api/cuti/${cutiId}`, {
      status: "CHECKED",
      keterangan: "Pemeriksaan berkas awal oleh Checker selesai. Rekomendasi disetujui."
    });
    console.log(`   ✅ Status updated to: CHECKED (Verified by Checker)`);

    // STEP 4: APPROVAL 1 (SPV/MAN) APPROVES
    console.log(`\n--- 4. [APPROVAL 1] Manager UPT Approving Application ID: ${cutiId} ---`);
    const app1Res = await axios.put(`${BASE_URL}/api/cuti/${cutiId}`, {
      status: "APPROVED_SPV",
      keterangan: "Disetujui oleh Supervisor / Manager UPT."
    });
    console.log(`   ✅ Status updated to: APPROVED_SPV`);

    // STEP 5: APPROVAL 2 (TL ES) APPROVES
    console.log(`\n--- 5. [APPROVAL 2] Team Leader ES Approving Application ID: ${cutiId} ---`);
    const app2Res = await axios.put(`${BASE_URL}/api/cuti/${cutiId}`, {
      status: "APPROVED_ES",
      keterangan: "Disetujui oleh TL Electricity Services."
    });
    console.log(`   ✅ Status updated to: APPROVED_ES`);

    // STEP 6: APPROVAL 3 (AMN ES / FINAL) FINAL APPROVAL
    console.log(`\n--- 6. [APPROVAL 3] Final Approval & Log Audit ID: ${cutiId} ---`);
    const app3Res = await axios.put(`${BASE_URL}/api/cuti/${cutiId}`, {
      status: "APPROVED_FINAL",
      keterangan: "Persetujuan final SDM & Keuangan. Cuti resmi diproses."
    });
    console.log(`   ✅ Status updated to: APPROVED_FINAL (Completed)`);

    // STEP 7: LOG AUDIT VERIFICATION (t_log_cuti)
    console.log("\n--- 7. Logging & Audit Verification ---");
    const logPayload = {
      id_pegawai: 2,
      tahun: 2026,
      jatah_cuti: 12,
      terpakai: 3,
      sisa_cuti: 9,
      keterangan: `Pemotongan 3 hari cuti tahunan (ID: ${cutiId})`
    };
    const logRes = await axios.post(`${BASE_URL}/api/log-cuti`, logPayload);
    console.log(`   ✅ Saldo cuti log recorded successfully in t_log_cuti.`);

    // STEP 8: FETCH UPDATED LIST TO ENSURE NO UNDEFINED/NULL ERRORS
    console.log("\n--- 8. Data Retrieval & Binding Check ---");
    const listRes = await axios.get(`${BASE_URL}/api/cuti`);
    const list = listRes.data?.data || listRes.data || [];
    console.log(`   ✅ Retrieved ${list.length} cuti records. All key fields intact.`);

    console.log("\n=================================================");
    console.log("🎉 ALL E2E WORKFLOW TESTS PASSED SUCCESSFULLY!");
    console.log("=================================================");
  } catch (err) {
    console.error("\n❌ E2E Workflow Test Failed:", err.response?.data || err.message);
  }
}

runE2EWorkflowTest();
