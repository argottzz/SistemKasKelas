-- =====================================================
-- db_kas_kelas — schema final
-- - users mulai KOSONG (register dulu)
-- - transactions.id_user NULL-able (data awal milik NULL)
-- - import_batches + file_hash UNIQUE anti impor ganda
-- =====================================================
CREATE DATABASE IF NOT EXISTS db_kas_kelas
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE db_kas_kelas;

CREATE TABLE IF NOT EXISTS users (
    id_user INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('bendahara', 'pengurus') NOT NULL DEFAULT 'pengurus',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_username (username)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS categories (
    id_category INT AUTO_INCREMENT PRIMARY KEY,
    nama_kategori VARCHAR(100) NOT NULL,
    jenis ENUM('income', 'expense') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_category (nama_kategori, jenis)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS import_batches (
    id_import INT AUTO_INCREMENT PRIMARY KEY,
    nama_file VARCHAR(255) NOT NULL,
    sheet_name VARCHAR(100) NOT NULL DEFAULT '',
    file_hash CHAR(64) NULL,
    jumlah_data INT NOT NULL DEFAULT 0,
    total_income DECIMAL(14,2) NOT NULL DEFAULT 0,
    total_expense DECIMAL(14,2) NOT NULL DEFAULT 0,
    total_savings DECIMAL(14,2) NOT NULL DEFAULT 0,
    id_user INT NULL,
    status ENUM('pending', 'success', 'failed') NOT NULL DEFAULT 'pending',
    keterangan TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_import_jumlah CHECK (jumlah_data >= 0),
    UNIQUE KEY uq_import_hash (file_hash),
    INDEX idx_import_status (status),
    CONSTRAINT fk_import_user FOREIGN KEY (id_user) REFERENCES users(id_user)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS transactions (
    id_transaction INT AUTO_INCREMENT PRIMARY KEY,
    id_user INT NULL,
    id_category INT NULL,
    id_import INT NULL,
    jenis ENUM('income','expense','savings','opening_balance') NOT NULL,
    nominal DECIMAL(12,2) NOT NULL,
    tanggal_transaksi DATE NOT NULL,
    keterangan TEXT NOT NULL,
    penerima_tabungan VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_transaction_nominal CHECK (nominal > 0),
    CONSTRAINT chk_transaction_recipient CHECK (
        (jenis = 'savings' AND penerima_tabungan IS NOT NULL AND TRIM(penerima_tabungan) <> '')
        OR (jenis <> 'savings' AND penerima_tabungan IS NULL)
    ),
    CONSTRAINT fk_transaction_user FOREIGN KEY (id_user) REFERENCES users(id_user)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_transaction_category FOREIGN KEY (id_category) REFERENCES categories(id_category)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_transaction_import FOREIGN KEY (id_import) REFERENCES import_batches(id_import)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_transaction_date (tanggal_transaksi),
    INDEX idx_transaction_type (jenis),
    INDEX idx_transaction_import (id_import)
) ENGINE=InnoDB;

-- Kategori awal (idempotent)
INSERT INTO categories (nama_kategori, jenis) VALUES
  ('Iuran Kas', 'income'),
  ('Denda', 'income'),
  ('Lainnya Masuk', 'income'),
  ('ATK / Fotocopy', 'expense'),
  ('Kebersihan', 'expense'),
  ('Kegiatan', 'expense'),
  ('Konsumsi', 'expense')
ON DUPLICATE KEY UPDATE nama_kategori = VALUES(nama_kategori);
