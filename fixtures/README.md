# Golden fixtures aturan domain

Folder ini satu-satunya yang dibagi antara `apps/api` (PHP) dan `apps/web` (TypeScript), sesuai N-10, N-67, dan AD-8.

Setiap berkas JSON berisi kasus uji untuk satu aturan domain murni: data masukan, `today`, `nowMinutes`, dan hasil yang diharapkan. Pest dan Vitest membaca berkas yang sama, sehingga kedua implementasi harus menghasilkan keluaran identik.

Aturan yang diikat fixture (Arsitektur Sistem 5.3):

- status projek dan sesi
- telat dan di luar periode
- aturan penutupan projek dan dampak
- Jadwal efektif dan pola mingguan
- penandaan bentrok blok dan Jadwal
- pembantu tanggal dan hari lewat
