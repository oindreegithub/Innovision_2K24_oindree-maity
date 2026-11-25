
import "dotenv/config";

import { pool } from "../config/database";
import { elasticClient } from "../config/elasticsearch";
import { indexEmail } from "../services/emailSearchService";

async function syncEmails() {
  try {
    console.log("Starting email indexing...");

    const result = await pool.query(
      "SELECT * FROM scheduled_emails ORDER BY id ASC"
    );

    console.log(`Found ${result.rows.length} emails in PostgreSQL.`);

    for (const email of result.rows) {
      await indexEmail(email);
    }

    console.log("All emails successfully indexed in Elasticsearch!");
  } catch (error) {
    console.error("Email indexing failed:", error);
    process.exitCode = 1;
  } finally {
    await elasticClient.close();
    await pool.end();
  }
}

syncEmails();
