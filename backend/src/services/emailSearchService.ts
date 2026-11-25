
import { elasticClient } from "../config/elasticsearch";

const INDEX_NAME = "scheduled_emails";

export async function initializeEmailIndex() {
  const exists = await elasticClient.indices.exists({
    index: INDEX_NAME,
  });

  if (!exists) {
    await elasticClient.indices.create({
      index: INDEX_NAME,
      mappings: {
        properties: {
          sender_email: { type: "keyword" },
          recipient_email: { type: "keyword" },
          subject: { type: "text" },
          body: { type: "text" },
          status: { type: "keyword" },
          scheduled_at: { type: "date" },
          sent_at: { type: "date" },
        },
      },
    });
  }

  console.log("Elasticsearch email index initialized!");
}

export async function indexEmail(email: any) {
  await initializeEmailIndex();

  await elasticClient.index({
    index: INDEX_NAME,
    id: String(email.id),
    document: {
      sender_email: email.sender_email,
      recipient_email: email.recipient_email,
      subject: email.subject,
      body: email.body,
      status: email.status,
      scheduled_at: email.scheduled_at,
      sent_at: email.sent_at || null,
    },
    refresh: "wait_for",
  });

  console.log(`Email ${email.id} indexed in Elasticsearch.`);
}

export async function searchEmails(searchTerm: string) {
  await initializeEmailIndex();

  const result = await elasticClient.search({
    index: INDEX_NAME,
    query: {
      multi_match: {
        query: searchTerm,
        fields: [
          "sender_email",
          "recipient_email",
          "subject",
          "body",
        ],
      },
    },
  });

  return result.hits.hits.map((hit) => hit._source);
}
