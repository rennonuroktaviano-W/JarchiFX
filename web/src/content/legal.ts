export type LegalDocument = {
  slug: string;
  title: string;
  description: string;
  updatedAt: string;
  sections: { heading: string; paragraphs: string[] }[];
};

export const legalDocuments: Record<string, LegalDocument> = {
  terms: {
    slug: "terms",
    title: "Syarat dan Ketentuan",
    description:
      "Ketentuan penggunaan situs dan pembelian akses kelas JarchiFX.",
    updatedAt: "8 November 2026",
    sections: [
      {
        heading: "Ruang lingkup",
        paragraphs: [
          "Dokumen ini mengatur penggunaan situs, pembelian akses kelas, dan penggunaan kode akses untuk komunitas Discord JarchiFX.",
          "Dokumen ini masih perlu ditinjau sebelum situs digunakan secara komersial.",
        ],
      },
      {
        heading: "Pembelian dan akses",
        paragraphs: [
          "Akses diberikan setelah pembayaran terverifikasi oleh sistem. Harga yang berlaku adalah harga yang tertera pada halaman paket saat order dibuat.",
          "Satu kode akses hanya berlaku untuk satu order dan satu kali redeem pada satu akun Discord.",
        ],
      },
      {
        heading: "Refund",
        paragraphs: [
          "Permintaan refund dapat diajukan melalui kontak resmi dengan menyertakan kode order. Setiap permintaan ditinjau berdasarkan status akses dan ketentuan yang berlaku.",
          "Kode akses yang sudah diredeem tidak dapat dipindahtangankan tanpa persetujuan admin.",
        ],
      },
      {
        heading: "Perilaku pengguna",
        paragraphs: [
          "Pengguna dilarang membagikan kode akses, materi, atau akses channel kepada pihak lain tanpa izin.",
          "Pelanggaran dapat menyebabkan pencabutan akses tanpa pengembalian dana.",
        ],
      },
      {
        heading: "Perubahan ketentuan",
        paragraphs: [
          "Ketentuan dapat diperbarui sewaktu-waktu. Versi terbaru selalu ditampilkan di halaman ini.",
        ],
      },
    ],
  },
  privacy: {
    slug: "privacy",
    title: "Kebijakan Privasi",
    description:
      "Cara JarchiFX mengumpulkan, menggunakan, dan menyimpan data pembeli.",
    updatedAt: "8 November 2026",
    sections: [
      {
        heading: "Data yang dikumpulkan",
        paragraphs: [
          "Kami menyimpan nama, alamat email, nomor WhatsApp, paket yang dibeli, status order, dan ID Discord yang digunakan saat redeem.",
          "Data pembayaran diproses oleh payment gateway. Kami tidak menyimpan nomor kartu atau kredensial pembayaran.",
        ],
      },
      {
        heading: "Penggunaan data",
        paragraphs: [
          "Data digunakan untuk memproses order, mengirim kode akses, memberikan role Discord, dan menangani dukungan.",
          "Data tidak dijual kepada pihak ketiga.",
        ],
      },
      {
        heading: "Penyimpanan dan keamanan",
        paragraphs: [
          "Kode akses disimpan dalam bentuk hash dan versi terenkripsi. Akses ke database dibatasi untuk keperluan operasional.",
          "Data disimpan selama diperlukan untuk memenuhi kewajiban operasional dan hukum.",
        ],
      },
      {
        heading: "Hak pengguna",
        paragraphs: [
          "Pengguna dapat meminta informasi, koreksi, atau penghapusan data dengan menghubungi kontak resmi.",
        ],
      },
    ],
  },
  risk: {
    slug: "risk",
    title: "Disclaimer Risiko",
    description:
      "Penjelasan risiko trading forex dan batas materi edukasi JarchiFX.",
    updatedAt: "8 November 2026",
    sections: [
      {
        heading: "Risiko trading",
        paragraphs: [
          "Trading forex melibatkan risiko tinggi dan dapat menyebabkan kehilangan seluruh dana yang digunakan. Hasil masa lalu tidak menjamin hasil di masa depan.",
          "Tidak ada strategi, materi, atau sinyal yang dapat menjamin keuntungan.",
        ],
      },
      {
        heading: "Batas materi",
        paragraphs: [
          "Seluruh materi disediakan untuk tujuan edukasi. Materi bukan rekomendasi investasi, ajakan bertransaksi, atau jaminan hasil.",
          "Keputusan transaksi sepenuhnya menjadi tanggung jawab pengguna.",
        ],
      },
      {
        heading: "Kesesuaian",
        paragraphs: [
          "Pastikan Anda memahami produk yang diperdagangkan dan mematuhi ketentuan regulator serta penyedia layanan yang berlaku di wilayah Anda.",
        ],
      },
    ],
  },
};
