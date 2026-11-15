-- Ekstensi untuk exclusion constraint rentang tanpa tumpang tindih (6.3).
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Database terpisah untuk pengujian integrasi (N-66).
CREATE DATABASE softblock_test OWNER softblock;
\connect softblock_test
CREATE EXTENSION IF NOT EXISTS btree_gist;
