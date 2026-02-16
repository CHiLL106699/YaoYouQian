/**
 * E2E Test Global Setup
 * 載入 .env.test 環境變數
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../../.env.test");

dotenv.config({ path: envPath, override: true });
