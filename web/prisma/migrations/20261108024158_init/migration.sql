-- CreateTable
CREATE TABLE `classes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(120) NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `price` INTEGER NOT NULL,
    `access_days` INTEGER NULL,
    `discord_role_id` VARCHAR(30) NOT NULL DEFAULT '',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `classes_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `order_code` VARCHAR(32) NOT NULL,
    `class_id` INTEGER NOT NULL,
    `buyer_name` VARCHAR(120) NOT NULL,
    `buyer_email` VARCHAR(190) NOT NULL,
    `buyer_whatsapp` VARCHAR(30) NOT NULL,
    `amount` INTEGER NOT NULL,
    `status` ENUM('pending', 'paid', 'expired', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
    `paid_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `orders_order_code_key`(`order_code`),
    INDEX `orders_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `order_id` BIGINT NOT NULL,
    `provider` VARCHAR(30) NOT NULL,
    `provider_ref` VARCHAR(100) NOT NULL,
    `method` VARCHAR(40) NOT NULL DEFAULT '',
    `raw_payload` JSON NULL,
    `status` VARCHAR(30) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `payments_provider_ref_key`(`provider_ref`),
    INDEX `payments_order_id_idx`(`order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `access_codes` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `order_id` BIGINT NOT NULL,
    `code_hash` CHAR(64) NOT NULL,
    `code_encrypted` TEXT NOT NULL,
    `status` ENUM('active', 'redeemed', 'expired', 'revoked') NOT NULL DEFAULT 'active',
    `expires_at` DATETIME(3) NULL,
    `redeemed_at` DATETIME(3) NULL,
    `redeemed_by_discord_id` VARCHAR(30) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `access_codes_order_id_key`(`order_id`),
    UNIQUE INDEX `access_codes_code_hash_key`(`code_hash`),
    INDEX `access_codes_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `members` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `discord_user_id` VARCHAR(30) NOT NULL,
    `class_id` INTEGER NOT NULL,
    `access_code_id` BIGINT NOT NULL,
    `access_until` DATETIME(3) NULL,
    `role_granted_at` DATETIME(3) NULL,
    `status` ENUM('active', 'expired', 'revoked') NOT NULL DEFAULT 'active',
    `role_status` ENUM('pending', 'granted', 'failed') NOT NULL DEFAULT 'pending',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `members_access_code_id_key`(`access_code_id`),
    INDEX `members_status_idx`(`status`),
    UNIQUE INDEX `members_discord_user_id_class_id_key`(`discord_user_id`, `class_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `redeem_attempts` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `discord_user_id` VARCHAR(30) NOT NULL,
    `code_hash_tried` CHAR(64) NOT NULL,
    `result` ENUM('success', 'invalid', 'used', 'expired', 'revoked', 'rate_limited') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `redeem_attempts_discord_user_id_created_at_idx`(`discord_user_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admins` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(120) NOT NULL,
    `email` VARCHAR(190) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `admins_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `jobs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(60) NOT NULL,
    `payload` JSON NOT NULL,
    `status` ENUM('pending', 'processing', 'done', 'failed') NOT NULL DEFAULT 'pending',
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `max_attempts` INTEGER NOT NULL DEFAULT 3,
    `run_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `last_error` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `jobs_status_run_at_idx`(`status`, `run_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `access_codes` ADD CONSTRAINT `access_codes_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `members` ADD CONSTRAINT `members_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `members` ADD CONSTRAINT `members_access_code_id_fkey` FOREIGN KEY (`access_code_id`) REFERENCES `access_codes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
