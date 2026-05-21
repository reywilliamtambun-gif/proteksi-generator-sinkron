// Data untuk Sistem Proteksi Generator Sinkron

export interface FaultData {
  id: string;
  name: string;
  cause: string;
  impact: string;
  protection: string;
  ansiCode: string;
  action: string;
  cbStatus: string;
  conclusion: string;
  icon: string;
  severity: 'critical' | 'warning' | 'info';
}

export const faultsData: FaultData[] = [
  {
    id: 'hubung-singkat',
    name: 'Hubung Singkat Internal',
    cause: 'Kerusakan isolasi kumparan stator atau hubungan antar fasa di dalam generator',
    impact: 'Arus gangguan sangat besar, kumparan rusak, dan risiko kebakaran',
    protection: 'Generator Differential Relay',
    ansiCode: '87G',
    action: 'Trip cepat',
    cbStatus: 'ON → TRIP',
    conclusion: 'Relay 87G bekerja untuk memutus generator dari sistem karena terjadi gangguan internal.',
    icon: '⚡',
    severity: 'critical'
  },
  {
    id: 'arus-lebih',
    name: 'Arus Lebih',
    cause: 'Beban terlalu besar atau gangguan hubung singkat eksternal',
    impact: 'Kumparan stator panas dan isolasi melemah',
    protection: 'Overcurrent Relay',
    ansiCode: '50/51',
    action: 'Alarm atau trip',
    cbStatus: 'ON → TRIP',
    conclusion: 'Relay 50/51 bekerja ketika arus generator melebihi batas setting.',
    icon: '🔥',
    severity: 'critical'
  },
  {
    id: 'gangguan-tanah',
    name: 'Gangguan Tanah',
    cause: 'Salah satu fasa menyentuh bodi atau tanah akibat kerusakan isolasi',
    impact: 'Arus bocor ke tanah, bahaya sengatan listrik, dan kerusakan isolasi',
    protection: 'Ground Fault Relay / Stator Ground Fault Relay',
    ansiCode: '51N / 64G',
    action: 'Alarm atau trip',
    cbStatus: 'ON → TRIP',
    conclusion: 'Relay gangguan tanah bekerja untuk mendeteksi arus bocor menuju tanah.',
    icon: '⏚',
    severity: 'critical'
  },
  {
    id: 'tegangan-lebih',
    name: 'Tegangan Lebih',
    cause: 'Eksitasi terlalu besar, beban tiba-tiba lepas, atau gangguan AVR',
    impact: 'Isolasi generator dan peralatan listrik dapat rusak',
    protection: 'Overvoltage Relay',
    ansiCode: '59',
    action: 'Alarm atau trip',
    cbStatus: 'ON → TRIP',
    conclusion: 'Relay 59 bekerja saat tegangan keluaran generator melebihi batas aman.',
    icon: '📈',
    severity: 'warning'
  },
  {
    id: 'tegangan-kurang',
    name: 'Tegangan Kurang',
    cause: 'Beban terlalu berat, eksitasi menurun, atau gangguan sistem',
    impact: 'Peralatan tidak bekerja normal dan sistem menjadi tidak stabil',
    protection: 'Undervoltage Relay',
    ansiCode: '27',
    action: 'Alarm atau trip',
    cbStatus: 'ON → TRIP',
    conclusion: 'Relay 27 bekerja ketika tegangan generator turun di bawah batas setting.',
    icon: '📉',
    severity: 'warning'
  },
  {
    id: 'frekuensi-kurang',
    name: 'Frekuensi Kurang',
    cause: 'Beban terlalu besar atau putaran prime mover menurun',
    impact: 'Sistem tenaga tidak stabil dan motor listrik dapat panas',
    protection: 'Underfrequency Relay',
    ansiCode: '81U',
    action: 'Alarm, load shedding, atau trip',
    cbStatus: 'ON → TRIP',
    conclusion: 'Relay 81U bekerja saat frekuensi turun di bawah batas normal.',
    icon: '⏱️',
    severity: 'warning'
  },
  {
    id: 'frekuensi-lebih',
    name: 'Frekuensi Lebih',
    cause: 'Beban tiba-tiba lepas atau putaran prime mover terlalu tinggi',
    impact: 'Generator dan peralatan bekerja di luar batas normal',
    protection: 'Overfrequency Relay',
    ansiCode: '81O',
    action: 'Alarm atau trip',
    cbStatus: 'ON → TRIP',
    conclusion: 'Relay 81O bekerja saat frekuensi melebihi batas aman.',
    icon: '⏱️',
    severity: 'warning'
  },
  {
    id: 'daya-balik',
    name: 'Daya Balik',
    cause: 'Prime mover kehilangan tenaga, tetapi generator masih terhubung ke jaringan',
    impact: 'Generator berubah menjadi motor dan menyerap daya dari sistem',
    protection: 'Reverse Power Relay',
    ansiCode: '32',
    action: 'Trip',
    cbStatus: 'ON → TRIP',
    conclusion: 'Relay 32 bekerja untuk mencegah generator bekerja sebagai motor.',
    icon: '🔄',
    severity: 'critical'
  },
  {
    id: 'kehilangan-eksitasi',
    name: 'Kehilangan Eksitasi',
    cause: 'Arus DC rotor hilang, AVR bermasalah, atau sistem eksitasi rusak',
    impact: 'Tegangan turun, generator kehilangan sinkronisasi, dan menyerap daya reaktif',
    protection: 'Loss of Excitation Relay',
    ansiCode: '40',
    action: 'Trip',
    cbStatus: 'ON → TRIP',
    conclusion: 'Relay 40 bekerja untuk melindungi generator saat medan magnet rotor hilang.',
    icon: '🧲',
    severity: 'critical'
  },
  {
    id: 'beban-tidak-seimbang',
    name: 'Beban Tidak Seimbang',
    cause: 'Beban antar fasa tidak merata atau salah satu fasa terganggu',
    impact: 'Muncul arus urutan negatif, rotor panas, dan getaran meningkat',
    protection: 'Negative Sequence Relay',
    ansiCode: '46',
    action: 'Alarm atau trip',
    cbStatus: 'ON → TRIP',
    conclusion: 'Relay 46 bekerja untuk melindungi generator dari arus urutan negatif.',
    icon: '⚖️',
    severity: 'warning'
  },
  {
    id: 'suhu-lebih',
    name: 'Suhu Lebih',
    cause: 'Beban berlebih, pendinginan gagal, ventilasi buruk, atau bearing panas',
    impact: 'Isolasi kumparan rusak dan risiko kebakaran meningkat',
    protection: 'Thermal Relay',
    ansiCode: '49',
    action: 'Alarm atau trip',
    cbStatus: 'ON → TRIP',
    conclusion: 'Relay 49 atau sensor suhu bekerja saat temperatur generator melebihi batas aman.',
    icon: '🌡️',
    severity: 'warning'
  },
  {
    id: 'over-excitasi',
    name: 'Over-Excitation',
    cause: 'Tegangan terlalu tinggi atau frekuensi terlalu rendah sehingga rasio V/Hz meningkat',
    impact: 'Fluks magnet berlebih, inti besi panas, dan isolasi tertekan',
    protection: 'Overexcitation Relay',
    ansiCode: '24',
    action: 'Alarm atau trip',
    cbStatus: 'ON → TRIP',
    conclusion: 'Relay 24 bekerja saat rasio V/Hz generator melebihi batas yang diizinkan.',
    icon: '⚡',
    severity: 'warning'
  },
  {
    id: 'out-of-step',
    name: 'Out of Step',
    cause: 'Generator kehilangan sinkronisasi akibat gangguan sistem atau perubahan beban mendadak',
    impact: 'Osilasi daya, arus tidak stabil, dan risiko kerusakan mekanik',
    protection: 'Out of Step Relay',
    ansiCode: '78',
    action: 'Trip',
    cbStatus: 'ON → TRIP',
    conclusion: 'Relay 78 bekerja untuk memisahkan generator dari sistem saat kehilangan sinkronisasi.',
    icon: '🔄',
    severity: 'critical'
  }
];

export interface ANSICode {
  code: string;
  name: string;
  function: string;
}

export const ansiCodes: ANSICode[] = [
  { code: '87G', name: 'Generator Differential Relay', function: 'Mendeteksi gangguan internal pada generator' },
  { code: '50', name: 'Instantaneous Overcurrent Relay', function: 'Mendeteksi arus lebih secara cepat' },
  { code: '51', name: 'Time Overcurrent Relay', function: 'Mendeteksi arus lebih dengan waktu tunda' },
  { code: '51N', name: 'Ground Overcurrent Relay', function: 'Mendeteksi arus gangguan tanah' },
  { code: '64G', name: 'Stator Ground Fault Relay', function: 'Mendeteksi gangguan tanah pada stator' },
  { code: '27', name: 'Undervoltage Relay', function: 'Mendeteksi tegangan kurang' },
  { code: '59', name: 'Overvoltage Relay', function: 'Mendeteksi tegangan lebih' },
  { code: '81U', name: 'Underfrequency Relay', function: 'Mendeteksi frekuensi kurang' },
  { code: '81O', name: 'Overfrequency Relay', function: 'Mendeteksi frekuensi lebih' },
  { code: '32', name: 'Reverse Power Relay', function: 'Mendeteksi daya balik agar generator tidak menjadi motor' },
  { code: '40', name: 'Loss of Excitation Relay', function: 'Mendeteksi kehilangan eksitasi' },
  { code: '46', name: 'Negative Sequence Relay', function: 'Mendeteksi beban tidak seimbang' },
  { code: '49', name: 'Thermal Relay', function: 'Mendeteksi suhu lebih pada generator' },
  { code: '24', name: 'Overexcitation / V/Hz Relay', function: 'Mendeteksi kelebihan eksitasi atau rasio V/Hz berlebih' },
  { code: '78', name: 'Out of Step Relay', function: 'Mendeteksi generator keluar sinkron' },
  { code: '50BF', name: 'Breaker Failure Relay', function: 'Mendeteksi kegagalan circuit breaker untuk trip' },
];

export interface ComponentData {
  id: number;
  name: string;
  function: string;
  description: string;
}

export const protectionComponents: ComponentData[] = [
  { id: 1, name: 'Generator Sinkron', function: 'Peralatan utama yang diproteksi', description: 'Generator sinkron mengubah energi mekanik menjadi energi listrik AC. Sebagai komponen utama dalam sistem pembangkit, generator memerlukan sistem proteksi yang andal untuk mencegah kerusakan akibat gangguan.' },
  { id: 2, name: 'CT / Current Transformer', function: 'Mengukur arus besar dan mengirim sinyal arus ke relay', description: 'CT menurunkan arus besar pada sisi primer menjadi arus kecil pada sisi sekunder (biasanya 5A atau 1A) yang dapat dibaca oleh relay proteksi. Rasio CT menentukan faktor pengali antara arus primer dan sekunder.' },
  { id: 3, name: 'PT / Potential Transformer', function: 'Mengukur tegangan dan mengirim sinyal tegangan ke relay', description: 'PT menurunkan tegangan tinggi pada sisi primer menjadi tegangan rendah pada sisi sekunder (biasanya 110V) yang dapat dibaca oleh relay proteksi. PT penting untuk relay yang bekerja berdasarkan tegangan seperti relay 27, 59, dan 24.' },
  { id: 4, name: 'Relay Proteksi', function: 'Mendeteksi gangguan berdasarkan arus, tegangan, frekuensi, daya, atau suhu', description: 'Relay proteksi adalah otak dari sistem proteksi. Relay menerima sinyal dari CT dan PT, menganalisis kondisi sistem, dan memberikan perintah alarm atau trip jika terdeteksi gangguan. Setiap relay memiliki kode ANSI sesuai fungsinya.' },
  { id: 5, name: 'Circuit Breaker', function: 'Memutus hubungan generator dengan sistem tenaga listrik', description: 'Circuit breaker (CB) adalah peralatan pemutus yang membuka rangkaian listrik ketika menerima sinyal trip dari relay melalui trip coil. CB harus mampu memutus arus gangguan dengan aman dan cepat.' },
  { id: 6, name: 'Trip Coil', function: 'Menerima sinyal trip dari relay untuk membuka circuit breaker', description: 'Trip coil adalah kumparan elektromagnetik yang menerima sinyal listrik dari relay proteksi. Ketika sinyal trip diterima, trip coil menghasilkan gaya magnet yang membuka mekanisme kunci circuit breaker.' },
  { id: 7, name: 'Alarm', function: 'Memberikan peringatan kepada operator', description: 'Alarm memberikan sinyal peringatan visual dan auditori kepada operator di control room. Alarm dapat berupa lampu indikator, buzzer, atau pesan pada HMI (Human Machine Interface).' },
  { id: 8, name: 'Panel Proteksi', function: 'Tempat relay, indikator, dan sistem kontrol proteksi', description: 'Panel proteksi adalah tempat terpusat untuk seluruh relay proteksi, indikator status, dan sistem kontrol. Panel ini biasanya terletak di control room dan memudahkan monitoring dan pengaturan proteksi.' },
  { id: 9, name: 'Sistem Eksitasi', function: 'Mengatur arus DC pada rotor generator', description: 'Sistem eksitasi menyediakan arus DC ke kumparan medan rotor untuk menghasilkan medan magnet. Sistem ini terdiri dari exciter, AVR, dan peralatan pengaturan arus eksitasi.' },
  { id: 10, name: 'AVR', function: 'Mengatur tegangan keluaran generator', description: 'AVR (Automatic Voltage Regulator) mengatur tegangan keluaran generator dengan mengontrol arus eksitasi. AVR memastikan tegangan terminal generator tetap stabil meskipun beban berubah.' },
];

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const quizData: QuizQuestion[] = [
  {
    id: 1,
    question: 'Apa fungsi utama sistem proteksi pada generator sinkron?',
    options: [
      'Menambah daya output generator',
      'Mendeteksi gangguan dan memutus generator dari sistem',
      'Mengatur kecepatan putaran rotor',
      'Meningkatkan efisiensi generator'
    ],
    correctIndex: 1,
    explanation: 'Sistem proteksi berfungsi mendeteksi gangguan atau kondisi tidak normal dan memberikan perintah alarm atau trip kepada circuit breaker untuk memisahkan generator dari sistem.'
  },
  {
    id: 2,
    question: 'Relay apa yang bekerja untuk mendeteksi gangguan internal pada generator?',
    options: ['Relay 50', 'Relay 87G', 'Relay 27', 'Relay 32'],
    correctIndex: 1,
    explanation: 'Relay 87G (Generator Differential Relay) bekerja dengan membandingkan arus masuk dan keluar generator. Jika ada perbedaan signifikan, berarti ada gangguan internal.'
  },
  {
    id: 3,
    question: 'Apa fungsi CT (Current Transformer) dalam sistem proteksi?',
    options: [
      'Memutus arus gangguan',
      'Mengukur tegangan',
      'Menurunkan arus besar menjadi arus kecil untuk relay',
      'Mengatur arus eksitasi'
    ],
    correctIndex: 2,
    explanation: 'CT menurunkan arus besar pada sisi primer menjadi arus kecil pada sisi sekunder (biasanya 5A) yang dapat dibaca oleh relay proteksi.'
  },
  {
    id: 4,
    question: 'Relay 32 berfungsi untuk mendeteksi...',
    options: [
      'Arus lebih',
      'Tegangan kurang',
      'Daya balik',
      'Frekuensi tidak normal'
    ],
    correctIndex: 2,
    explanation: 'Relay 32 (Reverse Power Relay) mendeteksi kondisi daya balik, yaitu ketika generator menyerap daya dari jaringan alih-alih menghasilkan daya.'
  },
  {
    id: 5,
    question: 'Apa yang terjadi ketika relay mendeteksi gangguan dan mengirim sinyal trip?',
    options: [
      'Generator langsung berhenti berputar',
      'Trip coil membuka circuit breaker dan generator terputus dari sistem',
      'AVR menurunkan tegangan',
      'CT meningkatkan arus'
    ],
    correctIndex: 1,
    explanation: 'Ketika relay mendeteksi gangguan, relay mengirim sinyal listrik ke trip coil. Trip coil kemudian membuka mekanisme circuit breaker sehingga generator terputus dari sistem.'
  },
  {
    id: 6,
    question: 'Kode ANSI 40 digunakan untuk relay...',
    options: [
      'Overvoltage Relay',
      'Loss of Excitation Relay',
      'Thermal Relay',
      'Out of Step Relay'
    ],
    correctIndex: 1,
    explanation: 'Relay 40 (Loss of Excitation Relay) mendeteksi kondisi kehilangan eksitasi pada generator, yaitu ketika arus DC rotor hilang atau medan magnet melemah.'
  },
  {
    id: 7,
    question: 'Sebuah generator masih terhubung ke jaringan, tetapi prime mover kehilangan tenaga. Generator mulai menyerap daya dari sistem. Relay apa yang harus bekerja?',
    options: ['Relay 59', 'Relay 32', 'Relay 81U', 'Relay 49'],
    correctIndex: 1,
    explanation: 'Relay 32 adalah reverse power relay yang bekerja saat terjadi daya balik, yaitu ketika arah daya berubah dari jaringan menuju generator.'
  },
  {
    id: 8,
    question: 'Relay 51N digunakan untuk mendeteksi...',
    options: [
      'Arus lebih fasa',
      'Gangguan tanah',
      'Tegangan lebih',
      'Frekuensi kurang'
    ],
    correctIndex: 1,
    explanation: 'Relay 51N (Ground Overcurrent Relay) mendeteksi arus gangguan tanah pada sisi netral generator.'
  },
  {
    id: 9,
    question: 'Apa perbedaan relay 50 dan relay 51?',
    options: [
      'Relay 50 untuk tegangan, relay 51 untuk arus',
      'Relay 50 trip instan, relay 51 trip dengan waktu tunda',
      'Relay 50 untuk DC, relay 51 untuk AC',
      'Relay 50 untuk rotor, relay 51 untuk stator'
    ],
    correctIndex: 1,
    explanation: 'Relay 50 (Instantaneous Overcurrent) bekerja secara instan ketika arus melebihi setting. Relay 51 (Time Overcurrent) bekerja dengan waktu tunda sesuai kurva waktu-arus yang telah diatur.'
  },
  {
    id: 10,
    question: 'Kode ANSI 64G adalah kode untuk...',
    options: [
      'Breaker Failure Relay',
      'Negative Sequence Relay',
      'Stator Ground Fault Relay',
      'Overexcitation Relay'
    ],
    correctIndex: 2,
    explanation: 'Relay 64G (Stator Ground Fault Relay) khusus mendeteksi gangguan tanah pada kumparan stator generator.'
  },
  {
    id: 11,
    question: 'Apa fungsi PT (Potential Transformer) dalam sistem proteksi?',
    options: [
      'Memutus tegangan tinggi',
      'Mengukur arus dan mengirim ke relay',
      'Menurunkan tegangan tinggi menjadi tegangan rendah untuk relay',
      'Mengatur tegangan eksitasi'
    ],
    correctIndex: 2,
    explanation: 'PT menurunkan tegangan tinggi pada sisi primer menjadi tegangan rendah (biasanya 110V) yang dapat dibaca oleh relay proteksi yang bekerja berdasarkan tegangan.'
  },
  {
    id: 12,
    question: 'Relay 46 berfungsi untuk mendeteksi...',
    options: [
      'Suhu lebih',
      'Daya balik',
      'Beban tidak seimbang / arus urutan negatif',
      'Kehilangan eksitasi'
    ],
    correctIndex: 2,
    explanation: 'Relay 46 (Negative Sequence Relay) mendeteksi ketidakseimbangan beban antar fasa yang menyebabkan munculnya arus urutan negatif yang dapat memanaskan rotor.'
  },
  {
    id: 13,
    question: 'Apa yang dimaksud dengan daya balik pada generator?',
    options: [
      'Arus yang melebihi batas normal',
      'Kondisi generator menyerap daya dari jaringan alih-alih menghasilkan',
      'Tegangan yang terlalu tinggi',
      'Frekuensi yang tidak stabil'
    ],
    correctIndex: 1,
    explanation: 'Daya balik terjadi ketika prime mover kehilangan tenaga tetapi generator masih terhubung ke jaringan, sehingga generator berubah menjadi motor dan menyerap daya dari sistem.'
  },
  {
    id: 14,
    question: 'Relay 81U bekerja saat...',
    options: [
      'Tegangan turun di bawah batas',
      'Frekuensi turun di bawah batas normal',
      'Arus melebihi batas',
      'Daya balik terdeteksi'
    ],
    correctIndex: 1,
    explanation: 'Relay 81U (Underfrequency Relay) mendeteksi kondisi frekuensi sistem yang turun di bawah batas normal, biasanya akibat beban berlebih atau penurunan putaran prime mover.'
  },
  {
    id: 15,
    question: 'Trip coil berfungsi untuk...',
    options: [
      'Mendeteksi gangguan',
      'Mengukur arus',
      'Menerima sinyal trip dari relay dan membuka circuit breaker',
      'Mengatur tegangan generator'
    ],
    correctIndex: 2,
    explanation: 'Trip coil adalah kumparan elektromagnetik yang menerima sinyal listrik dari relay proteksi dan menghasilkan gaya magnet untuk membuka mekanisme kunci circuit breaker.'
  },
  {
    id: 16,
    question: 'Relay 24 (Overexcitation Relay) bekerja berdasarkan...',
    options: [
      'Arus lebih',
      'Rasio V/Hz yang melebihi batas',
      'Daya balik',
      'Suhu lebih'
    ],
    correctIndex: 1,
    explanation: 'Relay 24 mendeteksi kelebihan eksitasi berdasarkan rasio tegangan terhadap frekuensi (V/Hz). Jika rasio ini melebihi batas, fluks magnet berlebih dan dapat merusak inti besi.'
  },
  {
    id: 17,
    question: 'Apa yang terjadi jika circuit breaker gagal trip meskipun relay sudah mengirim sinyal?',
    options: [
      'Generator aman karena relay sudah bekerja',
      'Relay 50BF (Breaker Failure Relay) akan mendeteksi kegagalan dan mengambil tindakan cadangan',
      'Sistem akan otomatis reset',
      'AVR akan menurunkan tegangan'
    ],
    correctIndex: 1,
    explanation: 'Relay 50BF (Breaker Failure Relay) mendeteksi jika circuit breaker gagal membuka setelah menerima sinyal trip. Relay ini akan mengambil tindakan cadangan seperti memutus CB lain di sekitarnya.'
  },
  {
    id: 18,
    question: 'Relay 78 (Out of Step Relay) mendeteksi kondisi...',
    options: [
      'Tegangan lebih',
      'Generator kehilangan sinkronisasi',
      'Arus lebih',
      'Suhu lebih'
    ],
    correctIndex: 1,
    explanation: 'Relay 78 mendeteksi kondisi out of step, yaitu ketika generator kehilangan sinkronisasi dengan sistem sehingga terjadi osilasi daya dan ketidakstabilan.'
  },
  {
    id: 19,
    question: 'Rumus kecepatan sinkron generator adalah Ns = 120f/P. Jika frekuensi 50 Hz dan jumlah kutub 4, berapa kecepatan sinkron?',
    options: [
      '1200 rpm',
      '1500 rpm',
      '3000 rpm',
      '750 rpm'
    ],
    correctIndex: 1,
    explanation: 'Ns = 120 × 50 / 4 = 6000 / 4 = 1500 rpm. Kecepatan sinkron berbanding terbalik dengan jumlah kutub.'
  },
  {
    id: 20,
    question: 'Relay 49 (Thermal Relay) bekerja berdasarkan...',
    options: [
      'Arus lebih sesaat',
      'Peningkatan suhu generator melebihi batas aman',
      'Gangguan tanah',
      'Kehilangan eksitasi'
    ],
    correctIndex: 1,
    explanation: 'Relay 49 mendeteksi peningkatan suhu generator yang melebihi batas aman, yang dapat disebabkan oleh beban berlebih, kegagalan pendinginan, atau bearing panas.'
  },
  {
    id: 21,
    question: 'Urutan kerja sistem proteksi yang benar adalah...',
    options: [
      'Gangguan → CB terbuka → Relay deteksi → Trip coil aktif',
      'Gangguan → Relay deteksi → Trip coil aktif → CB terbuka',
      'Relay deteksi → Gangguan → CB terbuka → Trip coil aktif',
      'Trip coil aktif → Gangguan → Relay deteksi → CB terbuka'
    ],
    correctIndex: 1,
    explanation: 'Urutan yang benar: Gangguan terjadi → Relay mendeteksi gangguan (melalui sinyal CT/PT) → Relay mengirim sinyal trip ke trip coil → Trip coil membuka circuit breaker.'
  },
  {
    id: 22,
    question: 'AVR (Automatic Voltage Regulator) berfungsi untuk...',
    options: [
      'Mendeteksi gangguan tanah',
      'Mengatur tegangan keluaran generator dengan mengontrol arus eksitasi',
      'Memutus generator dari sistem',
      'Mengukur arus generator'
    ],
    correctIndex: 1,
    explanation: 'AVR mengatur tegangan keluaran generator dengan mengontrol arus eksitasi pada rotor. Jika tegangan turun, AVR meningkatkan arus eksitasi dan sebaliknya.'
  },
  {
    id: 23,
    question: 'Gangguan tanah pada stator dapat menyebabkan...',
    options: [
      'Daya generator meningkat',
      'Arus bocor ke tanah, bahaya sengatan listrik, dan kerusakan isolasi',
      'Frekuensi meningkat',
      'Rotor berputar lebih cepat'
    ],
    correctIndex: 1,
    explanation: 'Gangguan tanah terjadi ketika fasa menyentuh bodi atau tanah, menyebabkan arus bocor ke tanah yang berbahaya bagi keselamatan dan dapat merusak isolasi.'
  },
  {
    id: 24,
    question: 'Mengapa generator perlu dilindungi dari beban tidak seimbang?',
    options: [
      'Karena beban tidak seimbang menyebabkan peningkatan daya output',
      'Karena arus urutan negatif yang muncul dapat memanaskan rotor',
      'Karena beban tidak seimbang meningkatkan tegangan',
      'Karena frekuensi menjadi lebih tinggi'
    ],
    correctIndex: 1,
    explanation: 'Beban tidak seimbang menghasilkan arus urutan negatif yang menginduksi arus pada rotor, menyebabkan pemanasan berlebih, getaran, dan penurunan efisiensi.'
  },
  {
    id: 25,
    question: 'Jika CT memiliki rasio 100/5 dan arus primer 120A, berapa arus sekunder yang terbaca relay?',
    options: [
      '5A',
      '6A',
      '12A',
      '24A'
    ],
    correctIndex: 1,
    explanation: 'Arus sekunder = Arus primer × (5 / 100) = 120 × 0.05 = 6A. Rasio CT 100/5 berarti arus primer 100A menghasilkan arus sekunder 5A.'
  }
];

export const studyCases = [
  {
    id: 1,
    title: 'Daya Balik',
    condition: 'Turbin kehilangan tenaga, tetapi generator masih terhubung ke jaringan.',
    analysis: [
      'Gangguan: daya balik',
      'Relay bekerja: 32 reverse power relay',
      'Aksi: circuit breaker trip',
      'Tujuan: mencegah generator bekerja sebagai motor'
    ]
  },
  {
    id: 2,
    title: 'Gangguan Tanah Stator',
    condition: 'Salah satu fasa pada stator menyentuh bodi generator akibat kerusakan isolasi.',
    analysis: [
      'Gangguan: ground fault',
      'Relay bekerja: 64G atau 51N',
      'Aksi: alarm atau trip',
      'Tujuan: mencegah kerusakan isolasi dan bahaya sengatan listrik'
    ]
  },
  {
    id: 3,
    title: 'Kehilangan Eksitasi',
    condition: 'Arus DC rotor hilang akibat gangguan pada sistem eksitasi.',
    analysis: [
      'Gangguan: loss of excitation',
      'Relay bekerja: 40',
      'Aksi: trip',
      'Tujuan: mencegah generator kehilangan sinkronisasi'
    ]
  },
  {
    id: 4,
    title: 'Beban Tidak Seimbang',
    condition: 'Beban antar fasa tidak seimbang sehingga muncul arus urutan negatif.',
    analysis: [
      'Gangguan: unbalanced load',
      'Relay bekerja: 46',
      'Aksi: alarm atau trip',
      'Tujuan: mencegah rotor panas berlebih'
    ]
  }
];

export const glossaryData = [
  { term: 'Trip', meaning: 'Kondisi ketika circuit breaker membuka rangkaian' },
  { term: 'Relay', meaning: 'Alat yang mendeteksi gangguan dan memberi perintah proteksi' },
  { term: 'CT', meaning: 'Alat ukur arus untuk sistem proteksi (Current Transformer)' },
  { term: 'PT', meaning: 'Alat ukur tegangan untuk sistem proteksi (Potential Transformer)' },
  { term: 'Trip Coil', meaning: 'Kumparan yang membuka circuit breaker saat mendapat sinyal trip' },
  { term: 'Circuit Breaker', meaning: 'Pemutus tenaga listrik' },
  { term: 'Eksitasi', meaning: 'Arus DC pada rotor untuk membentuk medan magnet' },
  { term: 'Daya Balik', meaning: 'Kondisi ketika generator menyerap daya dari jaringan' },
  { term: 'Gangguan Tanah', meaning: 'Gangguan ketika penghantar terhubung ke tanah' },
  { term: 'Diferensial', meaning: 'Proteksi yang membandingkan arus masuk dan keluar' },
  { term: 'ANSI', meaning: 'Standar penomoran fungsi relay proteksi' },
  { term: 'AVR', meaning: 'Automatic Voltage Regulator yang mengatur tegangan generator' },
  { term: 'Prime Mover', meaning: 'Penggerak utama generator (turbin, mesin diesel, dll)' },
  { term: 'Sinkronisasi', meaning: 'Kondisi generator sefasa dengan sistem jaringan' },
  { term: 'Urutan Negatif', meaning: 'Komponen arus yang muncul akibat beban tidak seimbang' },
];

export const commonMistakes = [
  {
    mistake: 'Semua gangguan cukup diproteksi dengan MCB',
    correct: 'Generator membutuhkan relay khusus sesuai jenis gangguan'
  },
  {
    mistake: 'Relay langsung memutus rangkaian daya',
    correct: 'Relay memberi sinyal trip, circuit breaker yang memutus rangkaian'
  },
  {
    mistake: 'CT dan PT memutus gangguan',
    correct: 'CT dan PT hanya mengukur arus dan tegangan'
  },
  {
    mistake: 'Daya balik sama dengan arus lebih',
    correct: 'Daya balik terjadi karena arah daya berubah, bukan karena arus melebihi batas'
  },
  {
    mistake: 'Kehilangan eksitasi hanya menyebabkan tegangan turun',
    correct: 'Kehilangan eksitasi juga dapat menyebabkan generator kehilangan sinkronisasi'
  },
  {
    mistake: 'Semua gangguan harus langsung trip',
    correct: 'Beberapa kondisi dapat diawali alarm, tergantung setting proteksi'
  }
];

export const evaluationQuestions = [
  'Jelaskan fungsi sistem proteksi pada generator sinkron.',
  'Jelaskan peran CT dan PT dalam sistem proteksi.',
  'Jelaskan fungsi relay 87G pada generator.',
  'Jelaskan perbedaan relay 50 dan 51.',
  'Jelaskan penyebab dan dampak daya balik pada generator sinkron.',
  'Jelaskan cara kerja relay kehilangan eksitasi 40.',
  'Jelaskan alur kerja proteksi dari gangguan sampai circuit breaker trip.',
  'Jelaskan mengapa generator perlu dilindungi dari beban tidak seimbang.',
  'Jelaskan fungsi relay 64G.',
  'Buat analisis singkat jika generator mengalami gangguan tanah pada stator.'
];

export const references = [
  'Chapman, S. J. Electric Machinery Fundamentals. McGraw-Hill.',
  'Umans, S. D. Fitzgerald & Kingsley\'s Electric Machinery. McGraw-Hill.',
  'Blackburn, J. L., & Domin, T. J. Protective Relaying: Principles and Applications. CRC Press.',
  'Mason, C. R. The Art and Science of Protective Relaying. Wiley.',
  'IEEE Std C37.102. Guide for AC Generator Protection.',
  'IEC 60255. Measuring Relays and Protection Equipment.',
  'Zuhal. Dasar Tenaga Listrik. Bandung: ITB.',
  'Modul Proteksi Sistem Tenaga Listrik.',
  'Modul Mesin Listrik dan Generator Sinkron.'
];
