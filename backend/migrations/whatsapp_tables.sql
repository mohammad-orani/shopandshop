-- ============================================================
--  WhatsApp Broadcast — Migration
--  Run once against your MySQL database
-- ============================================================

CREATE TABLE IF NOT EXISTS whatsapp_contacts (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    name             VARCHAR(255)  NOT NULL DEFAULT '',
    phone            VARCHAR(20)   NOT NULL,
    category         ENUM('VIP','Normal','New','Inactive','Custom') NOT NULL DEFAULT 'Normal',
    custom_category  VARCHAR(100)  NULL,
    created_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS whatsapp_broadcast_log (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    contact_id    INT           NULL,
    phone         VARCHAR(20)   NOT NULL,
    message       TEXT          NOT NULL,
    status        ENUM('sent','failed') NOT NULL,
    error_message TEXT          NULL,
    sent_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wbl_contact FOREIGN KEY (contact_id)
        REFERENCES whatsapp_contacts (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
