
CREATE TABLE IF NOT EXISTS scheduled_emails (
    id BIGSERIAL PRIMARY KEY,

    sender_email VARCHAR(255) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,

    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,

    scheduled_at TIMESTAMPTZ NOT NULL,

    status VARCHAR(20) DEFAULT 'scheduled'
        CHECK (status IN (
            'scheduled',
            'queued',
            'sent',
            'failed',
            'cancelled'
        )),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS
idx_scheduled_emails_status_time
ON scheduled_emails(status, scheduled_at);
-- STORE SLACK WORKSPACE INSTALLATIONS

CREATE TABLE IF NOT EXISTS slack_installations (
    workspace_id VARCHAR(100) PRIMARY KEY,
    workspace_name VARCHAR(255),
    bot_user_id VARCHAR(100),
    bot_token TEXT NOT NULL,
    installed_at TIMESTAMPTZ DEFAULT NOW()
);