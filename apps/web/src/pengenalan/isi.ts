import type { IconName } from '../ui/kit/icons'

export type JenisMiniatur = 'dashboard' | 'projek' | 'task' | 'todo' | 'kalender'

export type KartuAwal = { menu: string; icon: IconName; judul: string; teks: string; miniatur: JenisMiniatur }

/** O-02: satu kartu ringkasan untuk tiap menu, urut seperti navigasi utama. */
export const PENGENALAN_AWAL: KartuAwal[] = [
  {
    menu: 'Dashboard',
    icon: 'dashboard',
    judul: 'Mulai hari dari sini',
    teks: 'Task yang telat, rencana hari ini sampai 7 hari ke depan, sisa jam kosong, dan kemajuan projek ada di satu layar.',
    miniatur: 'dashboard',
  },
  {
    menu: 'Projek',
    icon: 'folder',
    judul: 'Pecah kerja besar menjadi sesi',
    teks: 'Buat projek dengan warnanya sendiri, bagi ke dalam sesi bertanggal, lalu isi tiap sesi dengan task dan dokumen.',
    miniatur: 'projek',
  },
  {
    menu: 'Task',
    icon: 'task_alt',
    judul: 'Semua task di satu daftar',
    teks: 'Cari dan saring per status atau label, lalu catat progress langsung dari baris task tanpa membuka detailnya.',
    miniatur: 'task',
  },
  {
    menu: 'To-do',
    icon: 'checklist',
    judul: 'Susun hari per jam',
    teks: 'Ambil task ke to-do hari ini, taruh di blok jam, lalu centang. Yang tertinggal pindah ke daftar "Belum selesai".',
    miniatur: 'todo',
  },
  {
    menu: 'Kalender',
    icon: 'calendar_today',
    judul: 'Lihat waktu yang tersisa',
    teks: 'Lihat sesi dan to-do per bulan atau minggu, catat jadwal tetap seperti kuliah, dan temukan jam yang masih kosong.',
    miniatur: 'kalender',
  },
]

export type KunciHalaman = 'dashboard' | 'projek' | 'detail-projek' | 'task' | 'todo' | 'kalender' | 'jadwal'

/**
 * `sasaran` berisi nilai atribut `data-pengenalan`; beberapa sasaran disorot sebagai satu area.
 * Langkah yang tidak satu pun sasarannya ada di layar dilewati.
 */
export type LangkahSorotan = { sasaran: string[]; judul: string; teks: string }

export type PengenalanHalaman = {
  nama: string
  langkah: LangkahSorotan[]
  /** Urutan indeks langkah di HP bila tata letaknya berbeda dari laptop (N-54). */
  urutanHp?: number[]
}

/** O-03: urutan mengikuti tata letak laptop (D-01). */
export const PENGENALAN_HALAMAN: Record<KunciHalaman, PengenalanHalaman> = {
  dashboard: {
    nama: 'Dashboard',
    // HP: telat, jam kosong dan to-do, 7 hari, kalender mini, projek dan pola kerja.
    urutanHp: [0, 2, 1, 3, 4, 5],
    langkah: [
      { sasaran: ['dashboard-telat'], judul: 'Task telat', teks: 'Task yang lewat tenggat selalu di paling atas, supaya tidak tertimbun task baru.' },
      {
        sasaran: ['dashboard-tujuh-hari'],
        judul: 'Hari ini + 7 hari',
        teks: 'Task dan sesi seminggu ke depan, dikelompokkan per hari. Pilih satu task untuk melihat detailnya.',
      },
      {
        sasaran: ['dashboard-todo', 'dashboard-jam-kosong'],
        judul: 'To-do dan jam kosong',
        teks: 'Berapa to-do hari ini yang sudah dicentang, dan berapa jam yang masih kosong di luar jadwal tetap.',
      },
      {
        sasaran: ['dashboard-kalender-mini'],
        judul: 'Kalender mini',
        teks: 'Tanggal bertanda punya task atau sesi. Pilih tanggal untuk membukanya di Kalender.',
      },
      {
        sasaran: ['dashboard-projek', 'dashboard-pola-kerja'],
        judul: 'Projek dan Pola kerja',
        teks: 'Kemajuan tiap projek yang berjalan, lalu jam kerjamu per hari. Pola kerja dimuat paling akhir.',
      },
      {
        sasaran: ['dashboard-tambah-task'],
        judul: 'Tambah task',
        teks: 'Catat task baru dari sini kapan saja. Task bisa masuk ke sesi projek atau berdiri sendiri.',
      },
    ],
  },
  projek: {
    nama: 'Projek',
    langkah: [
      {
        sasaran: ['projek-buat'],
        judul: 'Buat projek',
        teks: 'Beri nama, rentang tanggal, dan warna. Warna dan pola garis membedakan projek di Kalender.',
      },
      {
        sasaran: ['projek-filter'],
        judul: 'Saring per status',
        teks: 'Tampilkan projek yang berjalan, melewati jadwal, atau sudah ditutup. Pilih kartu projek untuk membuka sesi, task, dan dokumennya.',
      },
    ],
  },
  'detail-projek': {
    nama: 'Detail projek',
    langkah: [
      {
        sasaran: ['detail-tambah-sesi'],
        judul: 'Bagi ke dalam sesi',
        teks: 'Sesi adalah tahap bertanggal, misalnya "Riset" atau "Revisi". Garisnya tampil di Kalender.',
      },
      {
        sasaran: ['detail-sesi'],
        judul: 'Task per sesi',
        teks: 'Task dikelompokkan per sesi, dan progress sesi dihitung dari task di dalamnya. Tambah task langsung dari kartu sesi.',
      },
      { sasaran: ['detail-dokumen'], judul: 'Dokumen', teks: 'Tautkan berkas yang sering dibuka untuk projek ini.' },
      {
        sasaran: ['detail-aksi'],
        judul: 'Aksi projek',
        teks: 'Ubah, selesaikan lebih awal, batalkan, atau hapus projek. Tombol yang nonaktif menyebut alasannya saat ditunjuk.',
      },
    ],
  },
  task: {
    nama: 'Task',
    langkah: [
      { sasaran: ['task-tambah'], judul: 'Tambah task', teks: 'Task bisa masuk ke sesi projek atau berdiri sendiri.' },
      {
        sasaran: ['task-filter'],
        judul: 'Saring dan cari',
        teks: 'Gabungkan projek, sesi, label, dan status. Pencarian membaca nama task, projek, dan label.',
      },
      {
        sasaran: ['task-daftar'],
        judul: 'Aksi cepat di baris',
        teks: 'Catat progress, tambahkan ke to-do, atau selesaikan task langsung dari barisnya.',
      },
      { sasaran: ['task-label'], judul: 'Kelola label', teks: 'Buat, ganti nama, atau hapus label. Menghapus label tidak menghapus task.' },
    ],
  },
  todo: {
    nama: 'To-do',
    langkah: [
      {
        sasaran: ['todo-hari-ini'],
        judul: 'Hari ini dan mendatang',
        teks: 'Rencana hari ini paling atas, hari berikutnya di bawahnya. Beri tiap to-do blok jam, lalu centang saat selesai.',
      },
      { sasaran: ['todo-susun'], judul: 'Susun to-do', teks: 'Pilih task yang dikerjakan di satu hari, lalu atur blok jamnya di panel penyusunan.' },
      {
        sasaran: ['todo-belum-selesai'],
        judul: 'Belum selesai',
        teks: 'To-do 7 hari terakhir yang belum dikerjakan berkumpul di sini. Satu ketukan memindahkannya ke hari ini.',
      },
    ],
  },
  kalender: {
    nama: 'Kalender',
    langkah: [
      { sasaran: ['kalender-tampilan'], judul: 'Bulan, Minggu, dan Jadwal', teks: 'Bulan untuk gambaran besar, Minggu untuk melihat jam. Jadwal tetap diatur di tab Jadwal.' },
      { sasaran: ['kalender-isi'], judul: 'Panel hari', teks: 'Pilih tanggal untuk membuka panel hari berisi daftar kronologis sesi, to-do, dan jadwal.' },
      { sasaran: ['kalender-jam-kosong'], judul: 'Jam kosong', teks: 'Sisa jam pekan ini yang belum terisi jadwal, sesi, atau to-do.' },
    ],
  },
  jadwal: {
    nama: 'Jadwal',
    langkah: [
      {
        sasaran: ['jadwal-tambah'],
        judul: 'Jadwal berulang',
        teks: 'Catat kegiatan tetap seperti kuliah atau kerja paruh waktu sekali, lalu biarkan berulang tiap pekan.',
      },
      {
        sasaran: ['jadwal-sub'],
        judul: 'Aktif, Berakhir, Pengecualian',
        teks: 'Jadwal yang sudah diakhiri pindah ke Berakhir. Pengecualian dipakai untuk hari libur atau jadwal yang batal sekali saja.',
      },
    ],
  },
}
