import { tambahHari } from '../../domain/tanggal'
import type { Tabel, Tanggal } from '../../domain/tipe'

type IsiSeed = { [K in keyof Tabel]: Tabel[K][] }

/*
  Data contoh untuk akun demo di mode mock. Tanggal dihitung relatif dari "hari ini" agar
  setiap status (berjalan, jeda, telat, selesai, belum dijadwalkan) selalu muncul.
*/
export function buatSeed(hariIni: Tanggal): IsiSeed {
  const h = (n: number) => tambahHari(hariIni, n)
  const v = 1

  const projek: Tabel['projek'][] = [
    { id: 'p-skripsi', versi: v, nama: 'Skripsi Bab 3', deskripsi: 'Metodologi penelitian dan instrumen wawancara.', warna: '#2e8b7a', batal: false },
    { id: 'p-kos', versi: v, nama: 'Pindah Kos', deskripsi: 'Survei, kemas barang, dan urus kontrak baru.', warna: '#2f7fc1', batal: false },
    { id: 'p-jepang', versi: v, nama: 'Les Bahasa Jepang', deskripsi: 'Persiapan JLPT N4.', warna: '#b26a00', batal: false },
    { id: 'p-lomba', versi: v, nama: 'Lomba UI', deskripsi: 'Desain aplikasi untuk lomba kampus.', warna: '#8e5bb5', batal: false },
    { id: 'p-riset', versi: v, nama: 'Riset Pasar', deskripsi: 'Ide usaha kecil; belum dijadwalkan.', warna: '#9a6b4f', batal: false },
  ]

  const sesi: Tabel['sesi'][] = [
    { id: 's-skripsi-1', versi: v, projek_id: 'p-skripsi', nama: 'Sesi 1', deskripsi: '', mulai: h(-40), akhir: h(-11), batal: false },
    { id: 's-skripsi-2', versi: v, projek_id: 'p-skripsi', nama: 'Sesi 2', deskripsi: 'Bab 3 dan instrumen.', mulai: h(-10), akhir: h(26), batal: false },
    { id: 's-kos-1', versi: v, projek_id: 'p-kos', nama: 'Sesi 1', deskripsi: '', mulai: h(-5), akhir: h(12), batal: false },
    { id: 's-jepang-1', versi: v, projek_id: 'p-jepang', nama: 'Sesi 1', deskripsi: '', mulai: h(-30), akhir: h(-3), batal: false },
    { id: 's-jepang-2', versi: v, projek_id: 'p-jepang', nama: 'Sesi 2', deskripsi: '', mulai: h(19), akhir: h(48), batal: false },
    { id: 's-lomba-1', versi: v, projek_id: 'p-lomba', nama: 'Sesi 1', deskripsi: '', mulai: h(-60), akhir: h(-20), batal: false },
  ]

  const dokumen: Tabel['dokumen'][] = [
    { id: 'd-1', versi: v, projek_id: 'p-skripsi', nama: 'Draf bab 3', url: 'https://docs.example.com/draf-bab-3' },
    { id: 'd-2', versi: v, projek_id: 'p-skripsi', nama: 'Panduan skripsi', url: 'https://example.com/panduan.pdf' },
  ]

  const label_mandiri: Tabel['label_mandiri'][] = [
    { id: 'l-rumah', versi: v, nama: 'Rumah', terakhir_dipakai: `${h(-1)}T10:00:00Z` },
    { id: 'l-sehat', versi: v, nama: 'Kesehatan', terakhir_dipakai: `${h(-6)}T10:00:00Z` },
  ]

  const dasar = {
    versi: v,
    deskripsi: '',
    batal: false,
    dibatalkan_pada: null,
    dibatalkan_tanggal_lokal: null,
    dibuat_tanggal_lokal: h(-12),
  }
  const task: Tabel['task'][] = [
    { ...dasar, id: 't-1', sesi_id: 's-skripsi-2', label_id: null, nama: 'Daftar ujian proposal', deadline_tanggal: h(-4), deadline_menit: null, kesulitan: 2, progress: 2 },
    { ...dasar, id: 't-2', sesi_id: 's-skripsi-2', label_id: null, nama: 'Cari 10 jurnal rujukan', deadline_tanggal: h(-2), deadline_menit: null, kesulitan: 2, progress: 7 },
    { ...dasar, id: 't-3', sesi_id: 's-skripsi-2', label_id: null, nama: 'Kirim revisi bab 2', deadline_tanggal: h(0), deadline_menit: 20 * 60, kesulitan: 2, progress: 5 },
    { ...dasar, id: 't-4', sesi_id: 's-skripsi-2', label_id: null, nama: 'Susun kerangka bab 3', deadline_tanggal: h(1), deadline_menit: 17 * 60, kesulitan: 3, progress: 4 },
    { ...dasar, id: 't-5', sesi_id: 's-skripsi-2', label_id: null, nama: 'Bimbingan dengan dosen', deadline_tanggal: h(6), deadline_menit: 9 * 60, kesulitan: 1, progress: 10 },
    { ...dasar, id: 't-6', sesi_id: 's-skripsi-1', label_id: null, nama: 'Tentukan topik', deadline_tanggal: h(-20), deadline_menit: null, kesulitan: 3, progress: 10 },
    { ...dasar, id: 't-7', sesi_id: 's-kos-1', label_id: null, nama: 'Survei 3 kos', deadline_tanggal: h(2), deadline_menit: null, kesulitan: 2, progress: 6 },
    { ...dasar, id: 't-8', sesi_id: 's-kos-1', label_id: null, nama: 'Kemas buku', deadline_tanggal: h(9), deadline_menit: null, kesulitan: 1, progress: 0 },
    { ...dasar, id: 't-9', sesi_id: 's-jepang-1', label_id: null, nama: 'Hafal 50 kanji', deadline_tanggal: h(-5), deadline_menit: null, kesulitan: 4, progress: 10 },
    { ...dasar, id: 't-10', sesi_id: 's-jepang-2', label_id: null, nama: 'Latihan soal N4', deadline_tanggal: h(30), deadline_menit: null, kesulitan: 3, progress: 0 },
    { ...dasar, id: 't-11', sesi_id: 's-lomba-1', label_id: null, nama: 'Kirim karya', deadline_tanggal: h(-21), deadline_menit: 12 * 60, kesulitan: 4, progress: 10 },
    { ...dasar, id: 't-12', sesi_id: null, label_id: 'l-rumah', nama: 'Beli tinta printer', deadline_tanggal: h(4), deadline_menit: null, kesulitan: 1, progress: 0 },
    { ...dasar, id: 't-13', sesi_id: null, label_id: 'l-sehat', nama: 'Cek gigi', deadline_tanggal: null, deadline_menit: null, kesulitan: 2, progress: 0 },
    {
      ...dasar,
      id: 't-14',
      sesi_id: null,
      label_id: 'l-rumah',
      nama: 'Servis kipas',
      deadline_tanggal: h(-8),
      deadline_menit: null,
      kesulitan: 2,
      progress: 1,
      batal: true,
      dibatalkan_pada: `${h(-7)}T08:00:00Z`,
      dibatalkan_tanggal_lokal: h(-7),
    },
  ]

  const riwayat_progress: Tabel['riwayat_progress'][] = [
    { id: 'r-1', versi: v, task_id: 't-2', sebelum: 4, sesudah: 7, deskripsi: '7 jurnal terkumpul.', penanda: null, tanggal_lokal: h(-1), menit_lokal: 15 * 60 },
    { id: 'r-2', versi: v, task_id: 't-3', sebelum: 3, sesudah: 5, deskripsi: '', penanda: null, tanggal_lokal: h(0), menit_lokal: 9 * 60 },
    { id: 'r-3', versi: v, task_id: 't-5', sebelum: 6, sesudah: 10, deskripsi: 'Disetujui lanjut.', penanda: 'selesai', tanggal_lokal: h(-1), menit_lokal: 11 * 60 },
    { id: 'r-4', versi: v, task_id: 't-6', sebelum: 8, sesudah: 10, deskripsi: '', penanda: 'selesai', tanggal_lokal: h(-22), menit_lokal: 14 * 60 },
    { id: 'r-5', versi: v, task_id: 't-9', sebelum: 9, sesudah: 10, deskripsi: '', penanda: 'selesai', tanggal_lokal: h(-6), menit_lokal: 20 * 60 },
    { id: 'r-6', versi: v, task_id: 't-11', sebelum: 7, sesudah: 10, deskripsi: '', penanda: 'selesai', tanggal_lokal: h(-21), menit_lokal: 11 * 60 },
  ]

  const entri_todo: Tabel['entri_todo'][] = [
    { id: 'e-1', versi: v, task_id: 't-3', tanggal: h(0), ceklis: false },
    { id: 'e-2', versi: v, task_id: 't-4', tanggal: h(0), ceklis: false },
    { id: 'e-3', versi: v, task_id: 't-7', tanggal: h(0), ceklis: true },
    { id: 'e-4', versi: v, task_id: 't-2', tanggal: h(-1), ceklis: false },
  ]

  const blok_jam: Tabel['blok_jam'][] = [
    { id: 'b-1', versi: v, entri_id: 'e-1', tanggal: h(0), mulai_menit: 13 * 60, selesai_menit: 15 * 60 },
    { id: 'b-2', versi: v, entri_id: 'e-2', tanggal: h(0), mulai_menit: 16 * 60 + 30, selesai_menit: 18 * 60 },
  ]

  const jadwal: Tabel['jadwal'][] = [
    { id: 'j-kuliah', versi: v, nama: 'Kuliah Metodologi' },
    { id: 'j-futsal', versi: v, nama: 'Futsal' },
  ]

  const jadwal_versi: Tabel['jadwal_versi'][] = [
    { id: 'jv-1', versi: v, jadwal_id: 'j-kuliah', hari: [1, 3], mulai_menit: 8 * 60, selesai_menit: 10 * 60, berlaku_mulai: h(-60), berlaku_akhir: null, sekali_jalan: false },
    { id: 'jv-2', versi: v, jadwal_id: 'j-futsal', hari: [5], mulai_menit: 19 * 60, selesai_menit: 21 * 60, berlaku_mulai: h(-60), berlaku_akhir: null, sekali_jalan: false },
  ]

  return {
    projek,
    dokumen,
    sesi,
    label_mandiri,
    task,
    riwayat_progress,
    entri_todo,
    blok_jam,
    jadwal,
    jadwal_versi,
    pengecualian: [],
  }
}
