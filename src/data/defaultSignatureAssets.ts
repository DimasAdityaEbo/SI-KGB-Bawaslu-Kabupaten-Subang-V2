// Default vector graphics for official Indonesian stamp & digital signature

// Official round Indonesian government stamp for Bawaslu Kabupaten Subang (Cap Basah Ungu)
export const DEFAULT_CAP_BAWASLU_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
  <defs>
    <path id="upperArc" d="M 36,150 A 114,114 0 0,1 264,150" fill="none" />
    <path id="lowerArc" d="M 264,150 A 114,114 0 0,1 36,150" fill="none" />
    <filter id="inkRough" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" xChannelSelector="R" yChannelSelector="G" />
    </filter>
  </defs>

  <!-- Slight rotation for authentic stamped angle -->
  <g transform="rotate(-6, 150, 150)" filter="url(#inkRough)">
    <!-- Outer thick and inner thin circles -->
    <circle cx="150" cy="150" r="142" fill="none" stroke="#581c87" stroke-width="4.5" stroke-opacity="0.88" />
    <circle cx="150" cy="150" r="134" fill="none" stroke="#581c87" stroke-width="1.8" stroke-opacity="0.88" />
    <circle cx="150" cy="150" r="92" fill="none" stroke="#581c87" stroke-width="2" stroke-opacity="0.88" />

    <!-- Upper circular text -->
    <text font-family="'Arial', 'Helvetica', sans-serif" font-weight="900" font-size="14.5" fill="#581c87" fill-opacity="0.88" letter-spacing="2.5">
      <textPath href="#upperArc" startOffset="50%" text-anchor="middle">
        BADAN PENGAWAS PEMILIHAN UMUM
      </textPath>
    </text>

    <!-- Lower circular text -->
    <text font-family="'Arial', 'Helvetica', sans-serif" font-weight="900" font-size="14.5" fill="#581c87" fill-opacity="0.88" letter-spacing="3">
      <textPath href="#lowerArc" startOffset="50%" text-anchor="middle">
        ★ KABUPATEN SUBANG ★
      </textPath>
    </text>

    <!-- Center content: Emblem & Subang text -->
    <!-- Star on top of inner core -->
    <polygon points="150,104 153,113 162,113 155,119 157,128 150,123 143,128 145,119 138,113 147,113" fill="#581c87" fill-opacity="0.9" />
    
    <!-- Central Shield / Bawaslu eye silhouette -->
    <path d="M 150,128 C 172,128 185,142 185,150 C 185,158 172,172 150,172 C 128,172 115,158 115,150 C 115,142 128,128 150,128 Z" fill="none" stroke="#581c87" stroke-width="3" stroke-opacity="0.9" />
    <circle cx="150" cy="150" r="11" fill="#581c87" fill-opacity="0.9" />
    
    <!-- Dividing horizontal stripes in center -->
    <line x1="100" y1="184" x2="200" y2="184" stroke="#581c87" stroke-width="1.8" stroke-opacity="0.88" />
    <text x="150" y="196" font-family="'Arial', 'Helvetica', sans-serif" font-weight="800" font-size="10" fill="#581c87" fill-opacity="0.88" text-anchor="middle" letter-spacing="1.5">SEKRETARIAT</text>
  </g>
</svg>
`)}`;

// Default blue ink cursive signature for H. Tatang Koswara, S.Sos., M.Si
export const DEFAULT_TANDA_TANGAN_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 120" width="320" height="120">
  <g fill="none" stroke="#1d4ed8" stroke-linecap="round" stroke-linejoin="round">
    <!-- Main flourish initial "T" -->
    <path d="M 45,35 C 70,20 100,22 135,28 C 105,32 75,40 50,75 C 42,86 48,95 62,90 C 80,82 110,50 125,42" stroke-width="3.5" stroke-opacity="0.92" />
    <!-- Loop and cross stroke -->
    <path d="M 35,48 C 65,42 115,44 140,46" stroke-width="2.8" stroke-opacity="0.9" />
    
    <!-- Cursive name flow "tang" -->
    <path d="M 125,48 C 132,65 138,82 145,68 C 150,56 160,54 165,65 C 172,75 180,60 188,58 C 195,56 200,68 208,62 C 215,55 220,70 225,82" stroke-width="2.6" stroke-opacity="0.92" />
    <circle cx="166" cy="46" r="2.2" fill="#1d4ed8" fill-opacity="0.9" />
    
    <!-- Long dynamic underline flourish -->
    <path d="M 80,92 C 140,88 200,82 275,72 C 290,70 300,75 292,85 C 275,102 210,105 130,102" stroke-width="3" stroke-opacity="0.88" />
    
    <!-- Secondary flourish strokes -->
    <path d="M 235,50 C 248,38 260,45 258,62 C 255,80 270,72 285,68" stroke-width="2.4" stroke-opacity="0.9" />
  </g>
</svg>
`)}`;

// Default blue ink signature for Kasubag Administrasi (Dimas Ebo Suhartono, S.AP)
export const DEFAULT_TANDA_TANGAN_KASUBAG_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 120" width="320" height="120">
  <g fill="none" stroke="#1e40af" stroke-linecap="round" stroke-linejoin="round">
    <!-- Distinct cursive flourish for initial "D" -->
    <path d="M 50,25 C 50,60 48,85 52,95 C 60,98 85,96 115,80 C 145,62 140,28 100,26 C 75,25 52,48 50,60" stroke-width="3.2" stroke-opacity="0.92" />
    <!-- Loop transition -->
    <path d="M 98,65 C 115,55 130,58 142,75 C 150,85 160,70 172,60 C 182,52 195,65 205,58 C 215,52 225,60 235,55" stroke-width="2.6" stroke-opacity="0.9" />
    <circle cx="144" cy="48" r="2.2" fill="#1e40af" fill-opacity="0.9" />
    
    <!-- Underline slash flourish -->
    <path d="M 65,95 C 120,92 190,88 265,82 C 280,80 288,86 278,94 C 250,105 180,104 110,100" stroke-width="2.8" stroke-opacity="0.88" />
  </g>
</svg>
`)}`;
