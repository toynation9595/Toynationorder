import { config } from "dotenv";
config({ path: ".env.local" });

import bcrypt from "bcryptjs";
import { Pool } from "@neondatabase/serverless";

async function main() {
  const mobile = process.env.OWNER_MOBILE?.trim() ?? "";
  const pin = process.env.OWNER_PIN?.trim() ?? "";
  if (!/^[6-9]\d{9}$/.test(mobile)) throw new Error("OWNER_MOBILE must be a 10-digit Indian mobile");
  if (!/^\d{4,6}$/.test(pin)) throw new Error("OWNER_PIN must be 4-6 digits");

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const pinHash = await bcrypt.hash(pin, 10);
  await pool.query(
    `INSERT INTO users (mobile, name, pin_hash, role)
     VALUES ($1, 'Owner', $2, 'owner')
     ON CONFLICT (mobile) DO UPDATE SET pin_hash = EXCLUDED.pin_hash, role = 'owner',
       is_active = true, failed_attempts = 0, locked_until = NULL`,
    [mobile, pinHash]
  );
  await pool.end();
  console.log(`Owner ${mobile} ready.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
