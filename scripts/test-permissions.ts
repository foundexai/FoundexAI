import "./load-env";
import assert from "assert";

import { validateRolePermission } from "../app/api/documents/deal-room/route";

async function runTests() {
  console.log("=========================================");
  console.log("RUNNING DEAL ROOM PERMISSION TIERS TESTS");
  console.log("=========================================");

  const testCases = [
    {
      role: "founder",
      allowed: ["investor", "counsel"],
      expected: true,
      label: "Founder should bypass all tier restrictions",
    },
    {
      role: "co-founder",
      allowed: ["investor"],
      expected: true,
      label: "Co-founder should bypass all tier restrictions",
    },
    {
      role: "counsel",
      allowed: ["investor", "counsel"],
      expected: true,
      label: "Counsel should be allowed when listed in tiers",
    },
    {
      role: "lp",
      allowed: ["investor", "counsel"],
      expected: false,
      label: "LP should be blocked when not listed in allowed tiers",
    },
    {
      role: "investor",
      allowed: [],
      expected: true,
      label: "Empty allowed_tiers should allow all members",
    },
    {
      role: "investor",
      allowed: ["investor"],
      expected: true,
      label: "Investor role matches allowed_tiers investor tier",
    },
  ];

  let passed = 0;
  testCases.forEach((tc, idx) => {
    const res = validateRolePermission(tc.role, tc.allowed);
    try {
      assert.strictEqual(res.allowed, tc.expected);
      console.log(`✓ [Test #${idx + 1}] Passed: ${tc.label}`);
      passed++;
    } catch (err) {
      console.error(`✗ [Test #${idx + 1}] Failed: ${tc.label}`);
      console.error(`   Expected allowed = ${tc.expected}, got ${res.allowed}`);
    }
  });

  console.log("-----------------------------------------");
  console.log(`Test Execution Summary: ${passed}/${testCases.length} tests passed.`);
  console.log("=========================================");

  if (passed === testCases.length) {
    console.log("ALL PERMISSION TESTS SUCCESSFUL");
    process.exit(0);
  } else {
    console.error("SOME PERMISSION TESTS FAILED");
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution threw error:", err);
  process.exit(1);
});
