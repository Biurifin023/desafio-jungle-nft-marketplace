import { Link } from '@tanstack/react-router'
import type { FormEvent, ReactNode } from 'react'
import { FacebookIcon, InstagramIcon, LinkedinIcon, TwitterIcon, YoutubeIcon } from '@/components/icons'
import { NotAvailableLink, useNotAvailable } from '@/components/common/NotAvailable'
import { Logo } from './Header'
import { CATEGORY_LABEL, type Category } from '@/api/contracts'

const profileLinks = [
  { to: '/profile' as const, label: 'Meu perfil', available: true },
  { feature: 'Minha coleção', label: 'Minha coleção' },
  { feature: 'Atividade', label: 'Atividade' },
  { feature: 'Estúdio do criador', label: 'Estúdio do criador' },
  { to: '/favorites' as const, label: 'Lista de interesse', available: true },
]

const helpLinks = ['Central de ajuda', 'Como comprar NFTs', 'Carteira e segurança', 'Política do mercado', 'Denunciar item']
const collectionCats: Category[] = ['arte-digital', 'fotografia', 'musica', 'arte-3d', 'utilidade']

const social = [
  { Icon: FacebookIcon, label: 'Facebook', href: 'https://facebook.com' },
  { Icon: InstagramIcon, label: 'Instagram', href: 'https://instagram.com' },
  { Icon: TwitterIcon, label: 'X (Twitter)', href: 'https://x.com' },
  { Icon: LinkedinIcon, label: 'LinkedIn', href: 'https://linkedin.com' },
  { Icon: YoutubeIcon, label: 'YouTube', href: 'https://youtube.com' },
]

export function Footer() {
  const unavailable = useNotAvailable()

  function onNewsletter(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    unavailable('Newsletter')
  }

  return (
    <footer className="mt-16 hidden lg:block">
      <div className="page-container">
        <div className="grid gap-7 rounded-none bg-surface p-8 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1.3fr]">
          <ServiceMark mark="W" title="Segurança da carteira" text="Proteja sua carteira e colecione arte digital verificada com confiança." />
          <div aria-hidden className="hidden w-px bg-copper lg:block" />
          <ServiceMark mark="C" title="Criadores em destaque" text="Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede." />
          <div aria-hidden className="hidden w-px bg-copper lg:block" />
          <ServiceMark mark="D" title="Alertas de lançamentos" text="Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado." />
          <div aria-hidden className="hidden w-px bg-copper lg:block" />
          <div>
            <p className="text-lg font-bold text-cream">Antecipe-se ao próximo lançamento</p>
            <form onSubmit={onNewsletter} className="mt-4 flex overflow-hidden rounded-md bg-surface-3 shadow-glow">
              <label htmlFor="newsletter-email" className="sr-only">
                E-mail para novidades
              </label>
              <input
                id="newsletter-email"
                type="email"
                name="email"
                required
                placeholder="digite seu e-mail..."
                className="h-10 min-w-0 flex-1 bg-transparent px-3 text-sm text-cream outline-none placeholder:text-khaki"
              />
              <button type="submit" className="h-10 bg-copper px-4 text-lg font-bold text-ink hover:bg-amber">
                Enviar
              </button>
            </form>
            <p className="mt-4 text-[13px] leading-[22px] text-sand">
              Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-0 bg-surface-3">
        <div className="page-container grid gap-6 py-8 md:grid-cols-4">
          <Logo />
          <p className="text-sm leading-[22px] text-cream">
            Feito para colecionadores,
            <br />
            criadores e cultura
          </p>
          <a className="text-sm text-cream hover:text-amber" href="mailto:contato@email.com">
            contato@email.com
          </a>
          <a className="text-sm text-cream hover:text-amber" href="tel:+551140399999">
            +55 11 4002 8922
          </a>
        </div>
      </div>

      <div className="bg-surface">
        <div className="page-container grid gap-10 py-8 md:grid-cols-4">
          <FooterCol title="Meu perfil">
            {profileLinks.map((item) =>
              'available' in item && item.available && item.to ? (
                <Link key={item.label} to={item.to} className="block py-1 text-sm leading-[30px] text-cream hover:text-amber">
                  {item.label}
                </Link>
              ) : (
                <NotAvailableLink key={item.label} feature={item.feature ?? item.label} className="block py-1 text-left text-sm leading-[30px] text-cream hover:text-amber">
                  {item.label}
                </NotAvailableLink>
              ),
            )}
          </FooterCol>
          <FooterCol title="Central de ajuda">
            {helpLinks.map((label) => (
              <NotAvailableLink key={label} feature={label} className="block py-1 text-left text-sm leading-[30px] text-cream hover:text-amber">
                {label}
              </NotAvailableLink>
            ))}
          </FooterCol>
          <FooterCol title="Coleções">
            {collectionCats.map((cat) => (
              <Link
                key={cat}
                to="/"
                search={{ categories: [cat] }}
                hash="catalogo"
                resetScroll={false}
                className="block py-1 text-sm leading-[30px] text-cream hover:text-amber"
              >
                {CATEGORY_LABEL[cat]}
              </Link>
            ))}
          </FooterCol>
          <div>
            <p className="text-lg font-bold text-cream">Redes sociais</p>
            <ul className="mt-5 flex gap-2.5">
              {social.map(({ Icon, label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="grid size-[30px] place-items-center rounded-xs border border-copper text-copper hover:bg-surface-2"
                  >
                    <Icon className="size-4" />
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-8 text-lg font-bold text-cream">Carteiras compatíveis</p>
            <p className="mt-3 rounded-md border border-border-strong bg-surface-3 px-2 py-2 text-center text-[9px] font-bold tracking-widest text-amber">
              METAMASK · WALLETCONNECT · COINBASE
            </p>
          </div>
        </div>
        <p className="page-container pb-6 text-center text-sm leading-[30px] text-cream">© 2026 Kurio. Propriedade digital para todos.</p>
      </div>
    </footer>
  )
}

function ServiceMark({ mark, title, text }: { mark: string; title: string; text: string }) {
  return (
    <div>
      <div className="grid size-[74px] place-items-center rounded-full bg-copper text-2xl font-bold text-ink">{mark}</div>
      <p className="mt-3 text-[17px] font-bold text-cream">{title}</p>
      <p className="mt-3 max-w-[204px] text-sm leading-[22px] text-sand">{text}</p>
    </div>
  )
}

function FooterCol({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-lg font-bold text-cream">{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  )
}
