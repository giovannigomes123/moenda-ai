"""Gera o catálogo fictício da Moenda (cafés especiais, equipamentos e acessórios).

Tudo é inventado: torrefações, marcas e preços. Semente fixa, então o arquivo gerado é
sempre o mesmo. Os atributos existem para a IA usar depois: métodos compatíveis, moagem,
tamanho de filtro, perfil sensorial.
"""

import json
import random
import unicodedata
from pathlib import Path

random.seed(7)
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "catalog.json"
OUT_WEB = ROOT / "web" / "src" / "data" / "catalog.json"

TORREFACOES = ["Serra Alta", "Casa Ipê", "Grão Navegante", "Altitude Lab", "Sítio Três Pedras", "Cereja Torrefação"]
ORIGENS = [
    ("Mantiqueira de Minas", "BR", (1100, 1500)),
    ("Sul de Minas", "BR", (900, 1300)),
    ("Cerrado Mineiro", "BR", (900, 1250)),
    ("Chapada Diamantina", "BR", (1000, 1400)),
    ("Alta Mogiana", "BR", (900, 1200)),
    ("Caparaó", "BR", (1000, 1500)),
    ("Norte Pioneiro do Paraná", "BR", (600, 900)),
    ("Matas de Rondônia", "BR", (200, 450)),
    ("Yirgacheffe, Etiópia", "ET", (1800, 2200)),
    ("Huila, Colômbia", "CO", (1500, 1900)),
    ("Nyeri, Quênia", "KE", (1600, 1900)),
    ("Huehuetenango, Guatemala", "GT", (1500, 1900)),
]
VARIEDADES = ["Catuaí Amarelo", "Bourbon Amarelo", "Arara", "Mundo Novo", "Topázio", "Catucaí", "Gesha", "Caturra", "SL28"]
PROCESSOS = ["Natural", "Cereja descascado", "Lavado", "Fermentação anaeróbica", "Honey"]
TORRAS = ["Clara", "Média-clara", "Média", "Média-escura", "Escura"]
NOTAS = {
    "Clara": ["jasmim", "limão siciliano", "chá preto", "bergamota", "pêssego", "frutas vermelhas"],
    "Média-clara": ["laranja", "mel", "maçã verde", "damasco", "caramelo claro", "flor de laranjeira"],
    "Média": ["chocolate ao leite", "caramelo", "castanhas", "rapadura", "frutas amarelas", "baunilha"],
    "Média-escura": ["chocolate amargo", "nozes", "melaço", "cacau", "especiarias", "ameixa seca"],
    "Escura": ["cacau intenso", "tabaco", "caramelo queimado", "madeira", "chocolate 70%", "defumado"],
}
METODOS_POR_TORRA = {
    "Clara": ["V60", "Chemex", "AeroPress"],
    "Média-clara": ["V60", "Chemex", "AeroPress", "Coado de pano"],
    "Média": ["V60", "Prensa francesa", "AeroPress", "Coado de pano", "Moka"],
    "Média-escura": ["Espresso", "Moka", "Prensa francesa", "Coado de pano"],
    "Escura": ["Espresso", "Moka", "Prensa francesa"],
}
PERFIL = {"Clara": (5, 2, 4), "Média-clara": (4, 3, 4), "Média": (3, 3, 4), "Média-escura": (2, 4, 3), "Escura": (1, 5, 2)}
NOMES_CAFE = [
    "Aurora", "Neblina", "Ladeira", "Terra Roxa", "Cerejeira", "Vento Norte", "Pedra Branca", "Brisa", "Serenata", "Rio Doce",
    "Colheita Tardia", "Mirante", "Garoa", "Sol de Inverno", "Várzea", "Cordilheira", "Mata Alta", "Clareira", "Lua Cheia",
    "Alvorada", "Encosta", "Bruma", "Campo Alto", "Ventania", "Orvalho", "Riacho", "Seriema", "Jequitibá", "Araucária", "Sabiá",
]


def slugify(texto: str) -> str:
    base = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode().lower()
    return "-".join("".join(c if c.isalnum() else " " for c in base).split())


produtos: list[dict] = []


def add(p: dict) -> None:
    p["id"] = f"P{len(produtos) + 1:03d}"
    p["slug"] = slugify(f"{p['nome']} {p['id']}")
    produtos.append(p)


# Cafés: 60 (30 nomes, cada um com um lote "Reserva")
for i in range(60):
    nome = NOMES_CAFE[i % len(NOMES_CAFE)] + ("" if i < 30 else " Reserva")
    origem, pais, (amin, amax) = random.choice(ORIGENS)
    torra = random.choice(TORRAS)
    variedade = "Heirloom" if pais == "ET" else random.choice(VARIEDADES)
    acidez, corpo, docura = PERFIL[torra]
    pontos = round(random.uniform(82.0, 86.5) + (2.0 if i >= 30 else 0) + (1.0 if variedade == "Gesha" else 0), 1)
    peso = random.choice([250, 250, 500, 1000])
    forma = random.choice(["Grãos", "Grãos", "Moído para filtro", "Moído para espresso"])
    if forma == "Moído para espresso":
        metodos = ["Espresso", "Moka"]
    elif forma == "Moído para filtro":
        metodos = [m for m in METODOS_POR_TORRA[torra] if m != "Espresso"] or ["V60"]
    else:
        metodos = METODOS_POR_TORRA[torra]
    preco_250 = 38 + (pontos - 82) * 9 + (12 if pais != "BR" else 0)
    preco = round(preco_250 * (peso / 250) * (0.9 if peso >= 500 else 1), 2)
    add({
        "categoria": "cafe",
        "nome": nome,
        "marca": random.choice(TORREFACOES),
        "origem": origem,
        "pais": pais,
        "altitude_m": random.randrange(amin, amax, 50),
        "variedade": variedade,
        "processo": random.choice(PROCESSOS),
        "torra": torra,
        "notas": random.sample(NOTAS[torra], 3),
        "pontuacao_sca": min(pontos, 91.0),
        "peso_g": peso,
        "forma": forma,
        "metodos": metodos,
        "perfil": {"acidez": acidez, "corpo": corpo, "docura": docura},
        "descafeinado": i in (11, 44),
        "preco": preco,
        "estoque": random.choice([0, 3, 8, 15, 24, 40]),
    })

# Equipamentos e acessórios: 30
EQUIP = [
    ("Moedor manual Trilha", "moedor", ["V60", "Chemex", "AeroPress", "Prensa francesa", "Coado de pano", "Moka"], 289.9, {"regulagens": 40, "mos": "cônicas de aço", "espresso": False}),
    ("Moedor manual Trilha Pro", "moedor", ["Espresso", "V60", "Chemex", "AeroPress", "Prensa francesa", "Moka"], 649.0, {"regulagens": 90, "mos": "cônicas de aço", "espresso": True}),
    ("Moedor elétrico Rotor 40", "moedor", ["V60", "Chemex", "Prensa francesa", "Coado de pano", "Moka"], 899.0, {"regulagens": 40, "mos": "cônicas", "espresso": False}),
    ("Moedor elétrico Rotor 60 Espresso", "moedor", ["Espresso", "Moka", "AeroPress", "V60"], 2190.0, {"regulagens": 60, "mos": "planas 64 mm", "espresso": True}),
    ("Suporte V60 01 cerâmica", "cafeteira", ["V60"], 119.0, {"filtro": "V60 01", "xicaras": "1-2"}),
    ("Suporte V60 02 cerâmica", "cafeteira", ["V60"], 139.0, {"filtro": "V60 02", "xicaras": "1-4"}),
    ("Suporte V60 02 plástico", "cafeteira", ["V60"], 59.9, {"filtro": "V60 02", "xicaras": "1-4"}),
    ("Chemex 6 xícaras", "cafeteira", ["Chemex"], 329.0, {"filtro": "Chemex 6", "xicaras": "até 6"}),
    ("Prensa francesa Vale 600 ml", "cafeteira", ["Prensa francesa"], 159.0, {"capacidade_ml": 600}),
    ("Prensa francesa Vale 1 L", "cafeteira", ["Prensa francesa"], 199.0, {"capacidade_ml": 1000}),
    ("AeroPress clássica", "cafeteira", ["AeroPress"], 279.0, {"filtro": "AeroPress"}),
    ("AeroPress Go", "cafeteira", ["AeroPress"], 299.0, {"filtro": "AeroPress", "viagem": True}),
    ("Moka Ponte 3 xícaras", "cafeteira", ["Moka"], 149.0, {"capacidade_xicaras": 3, "inducao": False}),
    ("Moka Ponte 6 xícaras indução", "cafeteira", ["Moka"], 229.0, {"capacidade_xicaras": 6, "inducao": True}),
    ("Coador de pano Raiz com suporte", "cafeteira", ["Coado de pano"], 69.9, {"filtro": "pano"}),
    ("Máquina espresso Pressão 15", "cafeteira", ["Espresso"], 1890.0, {"bar": 15, "vaporizador": True}),
    ("Máquina espresso Pressão Compact", "cafeteira", ["Espresso"], 1290.0, {"bar": 15, "vaporizador": False}),
    ("Chaleira bico de ganso 600 ml", "chaleira", ["V60", "Chemex", "Coado de pano"], 189.0, {"eletrica": False}),
    ("Chaleira elétrica Precisão 900 ml", "chaleira", ["V60", "Chemex", "AeroPress", "Coado de pano", "Prensa francesa"], 549.0, {"eletrica": True, "controle_temperatura": True}),
    ("Balança Grama 0,1 g com timer", "balanca", ["V60", "Chemex", "AeroPress", "Espresso", "Prensa francesa"], 169.0, {"precisao_g": 0.1, "timer": True}),
    ("Balança Grama Espresso", "balanca", ["Espresso"], 259.0, {"precisao_g": 0.1, "timer": True, "cabe_na_bandeja": True}),
    ("Termômetro culinário digital", "acessorio", ["V60", "Chemex", "Coado de pano", "Prensa francesa"], 49.9, {}),
    ("Jarra de leite inox 350 ml", "acessorio", ["Espresso"], 89.0, {}),
    ("Tamper 51 mm", "acessorio", ["Espresso"], 99.0, {"diametro_mm": 51}),
    ("Tamper 58 mm", "acessorio", ["Espresso"], 129.0, {"diametro_mm": 58}),
    ("Dosador magnético 58 mm", "acessorio", ["Espresso"], 79.0, {"diametro_mm": 58}),
    ("Caneca térmica Trilha 350 ml", "acessorio", [], 119.0, {}),
    ("Pote hermético com válvula 500 g", "acessorio", [], 89.9, {}),
    ("Servidor de vidro 600 ml", "acessorio", ["V60", "Chemex"], 99.0, {}),
    ("Kit xícaras de espresso (2)", "acessorio", ["Espresso"], 79.9, {}),
]
for nome, tipo, metodos, preco, specs in EQUIP:
    add({
        "categoria": "equipamento",
        "tipo": tipo,
        "nome": nome,
        "marca": random.choice(["Vale", "Trilha", "Ponte", "Grama", "Raiz"]),
        "metodos": metodos,
        "specs": specs,
        "preco": preco,
        "estoque": random.choice([0, 2, 5, 9, 14]),
    })

# Filtros: 8
FILTROS = [
    ("Filtro de papel V60 01 (100 un.)", "V60 01", 24.9),
    ("Filtro de papel V60 02 (100 un.)", "V60 02", 26.9),
    ("Filtro de papel Chemex 6 (100 un.)", "Chemex 6", 64.9),
    ("Filtro de papel AeroPress (350 un.)", "AeroPress", 39.9),
    ("Filtro de pano reutilizável", "pano", 19.9),
    ("Filtro de papel 103 (40 un.)", "103", 9.9),
    ("Filtro metálico V60 02", "V60 02", 79.0),
    ("Filtro metálico AeroPress", "AeroPress", 69.0),
]
for nome, compat, preco in FILTROS:
    add({"categoria": "filtro", "nome": nome, "marca": "Moenda", "compativel_com": compat, "preco": preco, "estoque": random.choice([0, 20, 50, 80])})

# Kits e assinaturas: 6
add({"categoria": "kit", "nome": "Kit Começando no V60", "marca": "Moenda", "itens": ["Suporte V60 02 plástico", "Filtro de papel V60 02 (100 un.)", "Balança Grama 0,1 g com timer"], "metodos": ["V60"], "preco": 239.0, "estoque": 12})
add({"categoria": "kit", "nome": "Kit Espresso em Casa", "marca": "Moenda", "itens": ["Tamper 58 mm", "Jarra de leite inox 350 ml", "Balança Grama Espresso"], "metodos": ["Espresso"], "preco": 429.0, "estoque": 6})
add({"categoria": "kit", "nome": "Kit Prensa e Moedor", "marca": "Moenda", "itens": ["Prensa francesa Vale 600 ml", "Moedor manual Trilha"], "metodos": ["Prensa francesa"], "preco": 419.0, "estoque": 4})
add({"categoria": "kit", "nome": "Kit Presente Degustação", "marca": "Moenda", "itens": ["3 cafés de 250 g de origens diferentes"], "metodos": [], "preco": 159.0, "estoque": 20})
add({"categoria": "assinatura", "nome": "Assinatura Descoberta", "marca": "Moenda", "descricao": "1 café de 250 g por mês, escolhido pela curadoria", "frequencia": "mensal", "preco": 54.9, "estoque": 999})
add({"categoria": "assinatura", "nome": "Assinatura Dupla", "marca": "Moenda", "descricao": "2 cafés de 250 g por mês, perfis diferentes", "frequencia": "mensal", "preco": 99.9, "estoque": 999})

texto = json.dumps(produtos, ensure_ascii=False, indent=2)
OUT.write_text(texto, encoding="utf-8")
OUT_WEB.parent.mkdir(parents=True, exist_ok=True)
OUT_WEB.write_text(texto, encoding="utf-8")
contagem: dict[str, int] = {}
for p in produtos:
    contagem[p["categoria"]] = contagem.get(p["categoria"], 0) + 1
print(len(produtos), "produtos:", contagem)
