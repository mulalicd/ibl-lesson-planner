# PSI v9.1 — sažetak za odobrenje Direktora

**Šta odobravate:** dopunu uputstva po kojem AI piše pripreme (P4, odobreno 13.11., DL-P17).
**Osnova:** PSI v9.1 je **cijeli odobreni PSI v9.0 + jedna nova dopuna A16** i novi šablon (modul 3.9B).
Ništa iz v9.0 se ne briše i ne mijenja.

Puni tekst: `IDSS_IBL_PSI_v9_1_draft.md` (dopuna A16 i modul 3.9B).

## Šta dopuna A16 dodaje svakoj pripremi
Svi dijelovi se ispisuju unutar „Preporuke za izvođenje časa“, odmah poslije vremenske linije.

| Novi dio | Šta AI mora napisati |
|---|---|
| **MATERIJALI ZA ČAS** | Jedan spisak svega što nastavnik treba pripremiti, s količinom za ovaj razred („5 kopija teksta A — po jedna za svaku grupu“). Ništa što se kasnije koristi ne smije nedostajati. |
| **TOK ČASA** | Tabela s jednim redom po fazi: **Min · Faza · Oblik rada · Učenici rade · Nastavnik radi · Produkt / dokaz**. Svaka faza kaže ko radi (individualno, u paru, grupa, frontalno), šta radi, čime, šta nastaje i koliko traje. Minute se tačno sabiraju. |
| **PREDSTAVLJANJE NALAZA** | Zaseban blok: ko predstavlja, kome, u kojem obliku i koliko dugo; šta rade učenici koji slušaju; dva pitanja nastavnika poslije predstavljanja (bez „Tačno“, pravilo A4). |
| **REFLEKSIJA UČENIKA** | 2–3 pitanja za učenike, prilagođena uzrastu, na kraju časa. Jedno se vraća na istraživačko pitanje, a u jednom učenici sami provjeravaju svoje „Mogu …“. |
| **Pravilo povezanosti** | Svaki ishod I1–I4 ima aktivnost u toku časa, dokaz učenja i jedan kriterij „Mogu …“. |

Dodatna pravila: novi dio ne zamjenjuje „Savjete i trikove“, ćelije tabele su kratke, a riječi se ne prelamaju.

## Dokazi (automatske provjere, 28 kriterija)
Pokretanje 13.11. u 22:03, s dorađenim šablonom:

| Lekcija | Rezultat |
|---|---|
| g01 Zašto se snijeg topi? (Sachkunde 1, bs) | 28/28 |
| g02 Märchenfiguren (Deutsch 2, de) | 26/26 |
| g08 Fotosinteza (Biologie 5, bs) | 27/28, jedini pad je skraćenica „Individ.“; validator je sada prihvata |
| g12 Da li je laž ikada opravdana? (Ethik 6, bs) | 28/28 |
| g25 Bašeskijin Ljetopis (B/H/S 6, bs) | 28/28 |
| g26 isto, engleska verzija (en) | 25/25 |
| **Ukupno** | **6/6 priprema, prosjek 99,4 %, 5/6 potpuno bez greške** |

Napredak kroz tri kruga: Predstavljanje nalaza 3/5 → 6/6; Savjeti i trikovi 5/6 → 6/6; povezanost ishoda 2/3 → 6/6.

**Gdje čitate pripreme:**
https://github.com/mulalicd/ibl-lesson-planner/actions/runs/43516098104
Na dnu stranice kliknite „v91 / g01 (click to open)“ i ostale.

Ograda: automatske provjere mjere strukturu i pravila, ne pedagošku dubinu. Presudno je Vaše čitanje.

## Natpisi u provjeri kvaliteta (prijedlog, odobrava se zajedno s tekstom)
| Provjera | Natpis koji nastavnik vidi |
|---|---|
| section_materials | Materijali za čas |
| section_flow | Tok časa (tabela faza) |
| section_presentation | Predstavljanje nalaza |
| section_studentReflection | Refleksija učenika |
| phases_complete | Svaka faza ima oblik rada i minute |
| outcomes_aligned | Svaki ishod ima aktivnost, dokaz i kriterij „Mogu …“ |

## Šta se dešava nakon Vašeg „PSI v9.1 odobren“
1. Jedna izmjena u kodu (`PRODUCTION_PSI = "v91"`) i Pull Request; nove provjere se uključuju same.
2. Vi spajate PR, a deploy ide automatski.
3. Prva priprema nakon toga se provjerava uživo.
4. Povratak na v9.0 je ista izmjena unazad.

*Pripremljeno 2026-11-13 · P4 · Commander v1.7.0*
