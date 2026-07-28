const quotes = [
  { quote: 'Pendidikan adalah senjata paling ampuh untuk mengubah dunia.', author: 'Nelson Mandela' },
  { quote: 'Guru yang biasa-biasa, bercerita. Guru yang baik, menjelaskan. Guru yang hebat, mendemonstrasikan. Guru yang luar biasa, menginspirasi.', author: 'William Arthur Ward' },
  { quote: 'Anak-anak bukanlah gelas yang harus diisi, melainkan api yang harus dinyalakan.', author: 'Plutarch' },
  { quote: 'Setiap anak adalah seorang seniman. Masalahnya adalah bagaimana tetap menjadi seorang seniman setelah dewasa.', author: 'Pablo Picasso' },
  { quote: 'Pendidikan bukan hanya tentang mengisi ember, tetapi tentang menyalakan api.', author: 'W.B. Yeats' },
  { quote: 'Kegagalan adalah guru terbaik. Kesalahan adalah pelajaran berharga.', author: 'Merry Riana' },
  { quote: 'Belajar tanpa berpikir itu sia-sia, berpikir tanpa belajar itu berbahaya.', author: 'Konfusius' },
  { quote: 'Tujuan pendidikan adalah mempersiapkan generasi muda untuk mendidik diri mereka sendiri sepanjang hidup mereka.', author: 'Robert M. Hutchins' },
];

export default function QuoteCard() {
  const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const selected = quotes[dayOfYear % quotes.length];

  return (
    <div className="quote-card">
      <div className="relative z-10">
        <p className="text-lg font-medium">"{selected.quote}"</p>
        <p className="text-sm opacity-75 mt-3">- {selected.author}</p>
      </div>
    </div>
  );
}
