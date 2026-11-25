
import "dotenv/config";
import { Client } from "@elastic/elasticsearch";

export const elasticClient = new Client({
  node: process.env.ELASTICSEARCH_URL || "http://localhost:9200",
});

export async function checkElasticsearch() {
  try {
    const response = await elasticClient.ping();
    console.log("Elasticsearch connected successfully!");
    return response;
  } catch (error) {
    console.error("Elasticsearch connection failed:", error);
    throw error;
  }
}
