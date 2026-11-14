/**
 * GuidePage — korisničko uputstvo (Director 2026-11-14: "dodaj još korisničko uputstvo — prati korisnika kroz ovu
 * aplikaciju"). One page that walks a teacher through the app in the order of the work, each step with a real
 * screenshot (public/uputstvo/*.jpg). Open to everyone (also before sign-in, so the sign-in step can be read).
 * Texts: approval by the Director before release (P6 SPEC, release criteria).
 */
import { Link } from 'react-router-dom';
import { ArrowRight, Lightbulb, ShieldAlert } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import { cn } from '@/lib/utils';

interface Step {
  id: string;
  title: string;
  intro: string;
  actions: string[];
  image: string;
  alt: string;
  tip?: string;
}

const STEPS: Step[] = [
  {
    id: 'prijava',
    title: 'Prijava',
    intro: 'Aplikaciju koriste nastavnici IDSS-a sa školskom e-mail adresom. Lozinka nije potrebna.',
    actions: [
      'Upišite svoju školsku adresu (ime.prezime@idss.ba) i kliknite „Pošalji link za prijavu“.',
      'Otvorite e-mail i kliknite link. Aplikacija se otvara na „Planeru“.',
      'Nakon 30 minuta bez aktivnosti aplikacija vas sama odjavljuje; ponovite prijavu.',
    ],
    image: '1-prijava',
    alt: 'Stranica za prijavu sa poljem za e-mail adresu',
  },
  {
    id: 'obrazac',
    title: 'Nova priprema: obrazac',
    intro: 'Na „Planeru“ pripremu pravite u pet koraka. Jezičci u boji desno od lista vode kroz korake.',
    actions: [
      'Predmet: kliknite predmet.',
      'Razred: kliknite razred.',
      'Tema: upišite temu časa. Predznanje učenika i napomene nisu obavezni.',
      'Trajanje: izaberite dužinu časa i jezik pripreme (bosanski, njemački ili engleski).',
      'Generiši: provjerite podatke i kliknite „Generiši IBL Plan“.',
    ],
    image: '2-obrazac',
    alt: 'Obrazac za novu pripremu sa jezičcima koraka i karticom Zaglavlje pripreme',
    tip: 'Kartica „Zaglavlje pripreme“ lijevo pokazuje šta ste izabrali. Klikom na red ili jezičak vraćate se na taj korak.',
  },
  {
    id: 'ai-pise',
    title: 'AI piše pripremu',
    intro: 'Pisanje traje oko jedne do dvije minute. Blok na vrhu pokazuje dokle je AI stigao.',
    actions: [
      'Koraci „Parametri → AI piše pripremu → Provjera kvaliteta → Sačuvano“ pokazuju stvarno stanje.',
      'Svaka obojena oznaka je jedan napisani dio pripreme; plavo je za nastavnika, žuto za učenike, svijetloplavo za oboje.',
      'Dijelovi koji su već napisani mogu se otvoriti i čitati dok AI piše ostale.',
    ],
    image: '3-ai-pise',
    alt: 'Blok koji pokazuje da AI piše pripremu',
  },
  {
    id: 'radni-sto',
    title: 'Radni sto: čitanje pripreme',
    intro: 'Gotova priprema je na radnom stolu: sadržaj lijevo, jedan dio pripreme kao list u sredini.',
    actions: [
      'Kliknite dio u „Sadržaju“ ili koristite dugmad ispod lista za prethodni i sljedeći dio.',
      'Jezičci „Sve“, „Nastavnik“ i „Učenik“ desno od lista pokazuju samo dijelove za tu grupu.',
      '„Izvorni tekst“ pokazuje pripremu tačno kako ju je AI napisao; „Kopiraj“ je kopira.',
    ],
    image: '4-radni-sto',
    alt: 'Radni sto sa sadržajem pripreme i otvorenim dijelom UDICA',
  },
  {
    id: 'prepravi',
    title: 'Provjera kvaliteta i „Prepravi ovaj dio“',
    intro: 'Prije čuvanja pripremu možete doraditi, dio po dio.',
    actions: [
      'Žuti okvir „Provjera kvaliteta“ na vrhu pokazuje rezultat automatske provjere. Ako nešto nije u redu, „Popravi“ traži od AI-ja ispravku.',
      'U vrhu svakog lista je „Prepravi ovaj dio“. Upišite šta želite promijeniti (nije obavezno) i kliknite „Prepravi“. Mijenja se samo taj dio.',
    ],
    image: '5-prepravi',
    alt: 'Polje za izmjenu jednog dijela pripreme',
  },
  {
    id: 'planovi',
    title: 'Sačuvaj, Word i Planovi',
    intro: 'Sačuvana priprema ide u biblioteku „Planovi“, a Word dokument je na memorandumu škole.',
    actions: [
      'Kliknite „Sačuvaj plan“, a zatim „Word dokument“.',
      'U „Planovi“: „Moji“ su vaše pripreme, „Svi“ su pripreme svih nastavnika.',
      'Pretraga i filteri traže po temi, predmetu, razredu i vrsti časa; zvjezdica označava vaše omiljene.',
      'Mijenjati ili obrisati pripremu može samo njen autor ili direktor.',
    ],
    image: '6-planovi',
    alt: 'Biblioteka planova sa karticama, pretragom i filterima',
  },
  {
    id: 'dokument',
    title: 'Sačuvana priprema kao dokument',
    intro: 'Otvorena sačuvana priprema prikazuje se kao jedan neprekinut dokument.',
    actions: [
      'Sadržaj lijevo skače na dio koji kliknete i označava dio koji upravo čitate.',
      'Gore su „Word dokument“, zvjezdica, „Razgovor s AI-om“ i „Novi“.',
      'Na dnu su „Razgovori o ovoj pripremi“: svi razgovori s AI-om o ovom planu, sa izvozom u Word.',
    ],
    image: '7-dokument',
    alt: 'Sačuvana priprema prikazana kao dokument',
  },
  {
    id: 'razgovor',
    title: 'Razgovor s AI-om o sačuvanoj pripremi',
    intro: 'O svakoj sačuvanoj pripremi možete razgovarati s AI-om, bilo kada. Razgovor se čuva uz pripremu.',
    actions: [
      'Na pripremi kliknite „Razgovor s AI-om“. Priprema je u sredini, razgovor lijevo.',
      'Postavite pitanje, npr. „Generiši rubriku za ocjenjivanje dokaza učenja“, ili kliknite jedan od prijedloga.',
      '„Izvezi razgovor“ pravi Word dokument razgovora na memorandumu škole.',
    ],
    image: '8-razgovor',
    alt: 'Razgovor s AI-om pored sačuvane pripreme, sa dugmetom Dodaj u plan',
  },
  {
    id: 'amandmani',
    title: 'Amandmani: „Dodaj u plan“',
    intro: 'Originalna priprema se nikad ne prepisuje. Ono što uzmete iz razgovora dodaje se iza nje kao amandman.',
    actions: [
      '„Dodaj u plan“ ispod odgovora AI-ja dodaje odgovor kao „AMANDMAN 1“, „AMANDMAN 2“ …',
      '„Prepravi ovaj dio“ na sačuvanoj pripremi dodaje novu verziju tog dijela kao amandman; originalni dio ostaje.',
      'Amandmane može dodati autor pripreme ili direktor. „Vrati plan od prije izmjena“ (na stranici pripreme, kod razgovora) ih uklanja.',
    ],
    image: '9-amandman',
    alt: 'Amandman sa rubrikom na kraju pripreme',
  },
];

const BADGE = ['bg-brand-blue text-white', 'bg-brand-lightblue text-black', 'bg-brand-yellow text-black', 'bg-brand-red text-black', 'bg-black text-white'];

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="px-3 py-6 md:px-6">
        <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
          {/* Steps list: where the teacher is in the guide */}
          <nav aria-label="Koraci uputstva" className="hidden lg:block">
            <div className="sticky top-20 flex flex-col gap-1">
              <p className="px-2 pb-2 font-display text-sm font-extrabold">Koraci</p>
              {STEPS.map((s, i) => (
                <a key={s.id} href={`#${s.id}`} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-neutral-800 hover:bg-white">
                  <span className={cn('flex h-6 w-6 flex-none items-center justify-center rounded text-xs font-bold', BADGE[i % BADGE.length])}>{i + 1}</span>
                  {s.title}
                </a>
              ))}
              <a href="#savjeti" className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-neutral-800 hover:bg-white">
                <span className="flex h-6 w-6 flex-none items-center justify-center rounded bg-neutral-200 text-xs font-bold text-black">?</span>
                Savjeti
              </a>
            </div>
          </nav>

          <div className="min-w-0 space-y-8">
            <header className="rounded-lg bg-white px-5 py-6 shadow-[0_1px_0_rgb(221_221_221),0_18px_40px_rgba(0,0,0,0.10)] md:px-8">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Uputstvo za nastavnike</p>
              <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight md:text-4xl">Od prijave do gotove pripreme</h1>
              <p className="mt-2 max-w-3xl text-neutral-700">
                IBL Planer pravi pisanu pripremu nastavnog časa zasnovanu na istraživačkom učenju (IBL). Ovo uputstvo vas vodi kroz
                aplikaciju redom kojim radite: prijava, nova priprema, dorada, čuvanje, biblioteka i razgovor s AI-om.
              </p>
              <Link to="/chat" className="neu-btn-primary mt-4 inline-flex h-11 items-center gap-2 px-5 text-sm font-semibold">
                Napravi pripremu <ArrowRight className="h-4 w-4" />
              </Link>
            </header>

            {STEPS.map((s, i) => (
              <section key={s.id} id={s.id} aria-labelledby={`${s.id}-naslov`}
                className="scroll-mt-20 overflow-hidden rounded-lg bg-white shadow-[0_1px_0_rgb(221_221_221),0_18px_40px_rgba(0,0,0,0.10)]">
                <div className="grid gap-0 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                  <div className="px-5 py-6 md:px-8">
                    <div className="flex items-center gap-3">
                      <span className={cn('flex h-9 w-9 flex-none items-center justify-center rounded-md font-display text-lg font-extrabold', BADGE[i % BADGE.length])}>{i + 1}</span>
                      <h2 id={`${s.id}-naslov`} className="font-display text-2xl font-extrabold tracking-tight">{s.title}</h2>
                    </div>
                    <p className="mt-3 text-neutral-700">{s.intro}</p>
                    <ol className="mt-4 space-y-2">
                      {s.actions.map((a, k) => (
                        <li key={k} className="flex gap-3 text-[15px] leading-relaxed">
                          <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-neutral-100 text-[11px] font-bold">{k + 1}</span>
                          <span>{a}</span>
                        </li>
                      ))}
                    </ol>
                    {s.tip && (
                      <p className="mt-4 flex gap-2 rounded-md bg-brand-yellow/30 px-3 py-2 text-sm text-black">
                        <Lightbulb className="mt-0.5 h-4 w-4 flex-none" /> {s.tip}
                      </p>
                    )}
                  </div>
                  <figure className="border-t border-neutral-200 bg-neutral-100 p-3 xl:border-l xl:border-t-0">
                    <img src={`/uputstvo/${s.image}.jpg`} alt={s.alt} loading="lazy" width={1440} height={900}
                      className="h-auto w-full rounded-md shadow-[0_8px_20px_rgba(0,0,0,0.12)] ring-1 ring-neutral-200" />
                  </figure>
                </div>
              </section>
            ))}

            <section id="savjeti" className="scroll-mt-20 rounded-lg bg-white px-5 py-6 shadow-[0_1px_0_rgb(221_221_221),0_18px_40px_rgba(0,0,0,0.10)] md:px-8">
              <h2 className="font-display text-2xl font-extrabold tracking-tight">Savjeti</h2>
              <ul className="mt-4 space-y-3 text-[15px] leading-relaxed">
                <li className="flex gap-3">
                  <ShieldAlert className="mt-0.5 h-5 w-5 flex-none text-brand-red" />
                  <span>Ne upisujte imena učenika niti lične podatke (zdravlje, posebne potrebe, ocjene, porodica): ni u obrazac, ni u razgovor.</span>
                </li>
                <li className="flex gap-3">
                  <Lightbulb className="mt-0.5 h-5 w-5 flex-none text-primary" />
                  <span>Umjesto obrasca možete pripremu tražiti i u slobodnom razgovoru: na „Planeru“ kliknite „razgovarajte s AI-om“.</span>
                </li>
                <li className="flex gap-3">
                  <Lightbulb className="mt-0.5 h-5 w-5 flex-none text-primary" />
                  <span>Ako nešto ne izgleda kako treba, pritisnite Ctrl+F5 (na telefonu osvježite stranicu) i pokušajte ponovo.</span>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
