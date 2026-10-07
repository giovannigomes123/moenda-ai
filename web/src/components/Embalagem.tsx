import type { Produto, Torra } from "@/lib/catalogo";

// Cor do pacote pela torra: do grão claro ao quase preto.
const COR_TORRA: Record<Torra, string> = {
  Clara: "#c9a06a",
  "Média-clara": "#a9743f",
  Média: "#7c4f2c",
  "Média-escura": "#5a3520",
  Escura: "#3a2216",
};

function Pacote({ p }: { p: Produto }) {
  const cor = COR_TORRA[p.torra ?? "Média"];
  const clara = p.torra === "Clara" || p.torra === "Média-clara";
  const texto = clara ? "#2a1a0e" : "#f6efe4";
  return (
    <svg viewBox="0 0 200 240" role="img" aria-label={`Pacote do café ${p.nome}`} className="h-full w-full">
      <path d="M48 30 L152 30 L160 48 L168 214 Q100 226 32 214 L40 48 Z" fill={cor} />
      <path d="M48 30 L152 30 L160 48 L40 48 Z" fill="#000" opacity="0.18" />
      <path d="M86 30 L86 18 Q100 10 114 18 L114 30" fill="none" stroke={cor} strokeWidth="5" />
      <rect x="54" y="78" width="92" height="104" rx="6" fill="#f6f3ec" />
      <text x="100" y="100" textAnchor="middle" fontSize="7.5" fill="#5b6b62" fontFamily="monospace" letterSpacing="1">
        {(p.marca ?? "").toUpperCase()}
      </text>
      <text x="100" y="124" textAnchor="middle" fontSize="15" fontWeight="700" fill="#16201b">
        {p.nome.replace(" Reserva", "")}
      </text>
      {p.nome.endsWith("Reserva") && (
        <text x="100" y="140" textAnchor="middle" fontSize="8.5" fill="#a8741f" letterSpacing="2">
          RESERVA
        </text>
      )}
      <line x1="70" y1="150" x2="130" y2="150" stroke="#dde2dc" />
      <text x="100" y="164" textAnchor="middle" fontSize="8" fill="#3b4640">
        {(p.origem ?? "").split(",")[0]}
      </text>
      <text x="100" y="175" textAnchor="middle" fontSize="7.5" fill="#69736c">
        torra {p.torra?.toLowerCase()} · {p.peso_g} g
      </text>
      <text x="100" y="204" textAnchor="middle" fontSize="8" fill={texto} opacity="0.85" fontFamily="monospace">
        {p.pontuacao_sca?.toFixed(1)} SCA
      </text>
    </svg>
  );
}

// Ícones de traço para o que não é café.
const ICONES: Record<string, string> = {
  moedor: "M70 60h60v20H70zM80 80h40l8 90H72zM100 40v20M86 40h28M72 170h56v14H72z",
  cafeteira: "M60 70h80l-14 50H74zM74 120h52M100 120v40M70 170h60M70 160h60",
  chaleira: "M60 100h70q14 0 14 18v42H60zM144 120q26-10 34-40M80 100q0-24 25-24t25 24M95 76v-8",
  balanca: "M45 120h110v40H45zM60 108h80M70 140h30M120 134h20v12h-20z",
  acessorio: "M70 80h60v80H70zM130 100q22 0 22 20t-22 20M80 64h40",
  filtro: "M55 70h90l-30 80h-30zM70 90h60M80 110h40",
  kit: "M45 90h110v80H45zM45 90l20-26h70l20 26M100 64v106M45 120h110",
  assinatura: "M50 70h100v90H50zM50 70l50 44 50-44M60 150l25-24M140 150l-25-24",
};

export function Embalagem({ p, className = "" }: { p: Produto; className?: string }) {
  if (p.categoria === "cafe") {
    return (
      <div className={`flex items-center justify-center bg-folha-suave ${className}`}>
        <div className="h-[86%] aspect-[200/240]">
          <Pacote p={p} />
        </div>
      </div>
    );
  }
  const chave = p.categoria === "equipamento" ? (p.tipo ?? "acessorio") : p.categoria;
  return (
    <div className={`flex items-center justify-center bg-folha-suave ${className}`}>
      <svg viewBox="0 0 200 220" role="img" aria-label={p.nome} className="h-[62%] w-auto text-folha">
        <path d={ICONES[chave] ?? ICONES.acessorio} fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </div>
  );
}
