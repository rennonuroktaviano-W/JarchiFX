export const brand = {
  name: "JarchiFX",
  tagline: "Kelas Trading Forex",
  contactEmail: "admin@jarchifx.local",
};

export const hero = {
  label: `${brand.name} · ${brand.tagline}`,
  headline: "Belajar forex dengan sistem, bukan tebak-tebakan.",
  description:
    "Kelas terstruktur untuk trader yang ingin memahami cara kerja pasar, mengukur risiko, dan membangun proses trading yang bisa dievaluasi.",
  cta: "Daftar Sekarang",
  steps: [
    { number: "1", label: "Bayar" },
    { number: "2", label: "Terima kode akses" },
    { number: "3", label: "Aktifkan di Discord" },
  ],
};

export const problem = {
  title: "Kenapa banyak trader pemula merugi",
  paragraphs: [
    "Banyak orang masuk pasar dengan sinyal dan prediksi, tanpa memahami mengapa harga bergerak. Hasilnya, keputusan berubah setiap kali posisi mulai merugi.",
    "Risiko sering dihitung setelah posisi dibuka, bukan sebelum. Satu posisi besar bisa menghapus hasil dari puluhan posisi kecil.",
    "Tanpa catatan dan evaluasi, kesalahan yang sama berulang. Tanpa proses yang jelas, hasil yang baik pun sulit diulang.",
  ],
};

export const curriculum = {
  title: "Kurikulum",
  description:
    "Materi disusun bertahap, dari membaca pasar sampai mengevaluasi keputusan sendiri.",
  modules: [
    {
      number: "01",
      title: "Fondasi pasar forex",
      body: "Apa yang sebenarnya diperdagangkan, siapa pelakunya, kapan pasar aktif, dan bagaimana biaya transaksi bekerja.",
    },
    {
      number: "02",
      title: "Struktur dan konteks harga",
      body: "Membaca tren, area penting, dan pergerakan harga tanpa menebak arah hanya dari satu candle.",
    },
    {
      number: "03",
      title: "Manajemen risiko",
      body: "Menentukan ukuran posisi, batas kerugian per transaksi, dan hubungan antara risiko dengan tujuan yang realistis.",
    },
    {
      number: "04",
      title: "Rencana trading",
      body: "Menyusun aturan masuk, keluar, dan evaluasi yang bisa dijalankan konsisten pada kondisi pasar berbeda.",
    },
    {
      number: "05",
      title: "Psikologi dan jurnal",
      body: "Mengenali bias, mencatat keputusan, dan menggunakan data pribadi untuk memperbaiki proses.",
    },
    {
      number: "06",
      title: "Evaluasi dan pengembangan",
      body: "Meninjau hasil secara berkala, menguji perubahan aturan, dan berhenti ketika kondisi tidak mendukung.",
    },
  ],
};

export const howItWorks = {
  title: "Cara kerja akses",
  description:
    "Setelah pembayaran terverifikasi, sistem membuat kode unik yang hanya bisa dipakai satu kali.",
  steps: [
    {
      number: "01",
      title: "Bayar",
      body: "Pilih paket dan selesaikan pembayaran lewat metode yang tersedia di halaman pembayaran.",
    },
    {
      number: "02",
      title: "Terima kode",
      body: "Kode akses tampil di halaman order dan dikirim ke email yang kamu daftarkan.",
    },
    {
      number: "03",
      title: "Aktifkan",
      body: "Masuk ke server Discord, buka channel verifikasi, lalu jalankan perintah redeem.",
    },
  ],
  codeSample: "K7QM-4WXD-9PTA",
  discord: {
    command: "/redeem kode:K7QM-4WXD-9PTA",
    reply:
      "Berhasil. Role kelas sudah aktif, silakan buka channel kelas.",
  },
};

export const mentor = {
  title: "Mentor",
  name: "[ISI]",
  role: "[ISI]",
  bio: "[ISI]",
  experience: [
    "[ISI] pengalaman pasar",
    "[ISI] rekam jejak yang bisa diverifikasi",
    "[ISI] fokus materi",
  ],
};

export const community = {
  title: "Komunitas",
  description:
    "Diskusi dipisahkan per topik agar mudah diikuti. Setelah redeem, channel kelas terbuka sesuai paket.",
  channels: [
    "# pengumuman",
    "# materi",
    "# live-session",
    "# tanya-jawab",
    "# jurnal-trading",
    "# sinyal-edukasi",
  ],
};

export const packages = {
  title: "Paket",
  description:
    "Harga dan durasi akses dapat diubah dari data paket. Pilih satu paket untuk memulai.",
  cta: "Beli paket ini",
  featuredSlug: "kelas-pro",
  copy: {
    "kelas-dasar": {
      description:
        "Untuk trader yang ingin membangun dasar dan proses belajar yang terarah.",
      features: [
        "Akses channel materi dasar",
        "Sesi tanya jawab",
        "Jurnal trading",
        "Akses selama durasi paket",
      ],
    },
    "kelas-pro": {
      description:
        "Untuk trader yang sudah punya dasar dan ingin mengevaluasi proses dengan lebih dalam.",
      features: [
        "Seluruh materi kelas dasar",
        "Live session",
        "Channel sinyal edukasi",
        "Akses sesuai durasi paket",
      ],
    },
  },
};

export const faq = {
  title: "Pertanyaan yang sering diajukan",
  items: [
    {
      question: "Berapa lama akses kelas?",
      answer:
        "Durasi akses mengikuti paket yang dipilih. Paket dengan akses seumur hidup tidak memiliki tanggal berakhir.",
    },
    {
      question: "Metode pembayaran apa yang tersedia?",
      answer:
        "Pembayaran diproses lewat payment gateway dan mendukung metode yang tersedia di halaman pembayaran, seperti QRIS, virtual account, dan e-wallet.",
    },
    {
      question: "Apa itu kode akses?",
      answer:
        "Kode akses adalah kode unik yang dibuat setelah pembayaran terverifikasi. Satu kode hanya bisa dipakai satu kali untuk satu akun Discord.",
    },
    {
      question: "Bagaimana cara redeem kode?",
      answer:
        "Masuk ke server Discord, buka channel verifikasi, lalu ketik perintah redeem diikuti kode akses. Sistem akan memeriksa kode dan memberikan role.",
    },
    {
      question: "Apakah ada refund?",
      answer:
        "Kebijakan refund dijelaskan di Syarat dan Ketentuan. Ajukan permintaan lewat kontak yang tersedia dengan menyertakan kode order.",
    },
    {
      question: "Apakah kelas menjamin keuntungan?",
      answer:
        "Tidak. Trading forex memiliki risiko tinggi dan tidak ada jaminan hasil. Materi berfokus pada pemahaman pasar, manajemen risiko, dan proses evaluasi.",
    },
    {
      question: "Salah masuk akun Discord, bisa dipindah?",
      answer:
        "Hubungi admin dengan kode order dan ID Discord yang benar. Pemindahan hanya dilakukan setelah data diverifikasi.",
    },
  ],
};

export const footer = {
  disclaimer:
    "Trading forex memiliki risiko tinggi dan dapat menyebabkan kehilangan dana. Materi di situs ini bersifat edukasi dan bukan ajakan untuk bertransaksi. Tidak ada jaminan keuntungan.",
  links: [
    { label: "Syarat dan Ketentuan", href: "/legal/terms" },
    { label: "Kebijakan Privasi", href: "/legal/privacy" },
    { label: "Disclaimer Risiko", href: "/legal/risk" },
    { label: "Kontak", href: `mailto:${brand.contactEmail}` },
  ],
};

export const navigation = [
  { id: "hero", label: "Beranda" },
  { id: "masalah", label: "Masalah" },
  { id: "kurikulum", label: "Kurikulum" },
  { id: "cara-kerja", label: "Cara kerja" },
  { id: "mentor", label: "Mentor" },
  { id: "komunitas", label: "Komunitas" },
  { id: "paket", label: "Paket" },
  { id: "faq", label: "FAQ" },
];
