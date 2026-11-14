# L-2 — Provjera pravopisa: prijedlog za odobrenje Direktora

Status: PRIJEDLOG (Direktor 2026-11-14: „pripremi prijedlog s cijenom i rizicima“). Ništa nije uključeno.

## Problem (dokaz)
- Eval run 43543883627: u jednoj njemačkoj pripremi naslov glasi „TIPPPS & TRICKS“ (tri slova P). Zato
  provjera nije našla dio „Savjeti i trikovi“.
- Direktor je ranije uočio „u pojedinim riječima nedostaju slova“. Primjer s ekrana još nemamo.

## Šta sam izmjerio (2026-11-14, besplatni rječnici, na stvarnoj pripremi „Fotosinteza“, 1.398 riječi)
| Rječnik | Licenca | Veličina | Nalaz |
|---|---|---|---|
| bosanski (`dictionary-bs` 1.0.2, npm) | LGPL-3.0 | 1,6 MB | **Paket je oštećen**: datoteka s pravilima je HTML stranica. Upotrebljiv je samo izvorni LibreOffice `bs_BA` (ISO-8859-2, mora se pretvoriti u UTF-8). |
| bosanski (LibreOffice `bs_BA`) | LGPL-3.0 | 0,35 MB + pravila | Hvata prave greške („Učenci → Učenici“, „grupma → grupa“, „Nastavnk → Nastavni“). Ali **~10 lažnih uzbuna po pripremi** na ispravnim riječima: glukoza, solarna, poster, apsorpciji, nusproizvodima, pojašnjava. Rječnik je mali (30.542 riječi) i nema stručnih pojmova. |
| njemački (`dictionary-de` 3.0.0) | GPL-2.0 ili GPL-3.0 | 1,2 MB | Hvata „Tippps → Tipps“. Ali **ne prepoznaje složenice**: Lehrkraft, Forschungsfrage, Stundenverlauf, Lernnachweis, Paararbeit su sve „nepoznate“. Biblioteka `nspell` ne podržava složenice. |
| engleski (`dictionary-en-gb` 3.0.0) | MIT i BSD | 0,6 MB | Nije posebno mjeren; engleski nema problem složenica. |

Brzina: provjera riječi traje ~3 ms po pripremi, a prijedlozi ispravki ~10 s. Zato bi se prijedlozi
računali samo za stvarno sumnjive riječi.

## Zaključak
Puna provjera pravopisa rječnikom **još nije spremna za prikaz nastavnicima**. Lažnih uzbuna bi bilo više nego
pravih grešaka, posebno u njemačkom, i nastavnici bi prestali vjerovati oznaci.

## Prijedlog (u 2 koraka, sve besplatno, bez dodatnog poziva AI-u i bez čekanja)
**Korak 1 — „čuvar naslova i slova“ (preporučeno odmah).**
- a) Svaki naslov u pripremi se poredi sa spiskom stalnih naslova iz PSI-ja (Modul 3.10, tri jezika). Naslov
  koji se razlikuje za 1–2 slova automatski se ispravlja („TIPPPS & TRICKS“ → „TIPPS & TRICKS“). To je sigurno,
  jer su naslovi unaprijed poznati.
- b) Riječ s tri ista slova zaredom („Tippps“, „ččč“) označava se kao moguća greška.
- Cijena: 0 KM, nijedna nova biblioteka, oko 1 dan rada. Rizik: nizak. Mijenjaju se samo poznati naslovi, a
  ostalo se samo označava.

**Korak 2 — mjerenje prije uključivanja rječnika (samo u evaluaciji, nastavnik ništa ne vidi).**
- Rječnici se koriste samo u automatskoj evaluaciji, sa spiskom dozvoljenih stručnih riječi koji raste.
  Tako mjerimo koliko često AI zaista griješi u pisanju.
- Rječnik se prikazuje nastavnicima tek kada lažnih uzbuna bude manje od 1 po pripremi, i to uz Vaše posebno
  odobrenje.
- Cijena: 0 KM. Pazi se na licence: njemački rječnik je GPL, zato se koristi samo u evaluaciji (ne isporučuje
  se uz aplikaciju), dok se ne provjeri da li je isporuka u redu.

## Odluka
„L-2 korak 1 da“, i po želji „L-2 korak 2 da“.
