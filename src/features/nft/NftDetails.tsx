import type { Nft } from '@/api/contracts'
import { LinkedinIcon, TwitterIcon } from '@/components/icons'
import { NotAvailableLink } from '@/components/common/NotAvailable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Mail } from 'lucide-react'
import { NftStars } from './NftStars'
import { shortAddress } from './format'

export function NftMeta({ nft }: { nft: Nft }) {
  return (
    <dl className="flex flex-col gap-3 text-[15px] leading-[19.8px] text-khaki">
      <div>
        <dt className="inline">ID do token: </dt>
        <dd className="inline">{nft.tokenId}</dd>
      </div>
      <div>
        <dt className="inline">Coleção: </dt>
        <dd className="inline">{nft.collection.name}</dd>
      </div>
      <div>
        <dt className="inline">Atributos: </dt>
        <dd className="inline">{nft.attributes.join(', ')}</dd>
      </div>
      <div>
        <dt className="inline">Criador: </dt>
        <dd className="inline">
          {nft.creator.name} ({nft.creator.handle})
        </dd>
      </div>
    </dl>
  )
}

export function NftShare() {
  return (
    <div className="flex items-center gap-2">
      <p className="text-[15px] font-bold text-cream">Compartilhar este NFT:</p>
      <NotAvailableLink feature="Compartilhar no LinkedIn" className="grid size-[18px] place-items-center text-cream hover:text-amber">
        <LinkedinIcon aria-hidden className="size-3.5" />
        <span className="sr-only">LinkedIn</span>
      </NotAvailableLink>
      <NotAvailableLink feature="Compartilhar por mensagem" className="grid size-[18px] place-items-center text-cream hover:text-amber">
        <Mail aria-hidden className="size-3.5" />
        <span className="sr-only">Mensagem</span>
      </NotAvailableLink>
      <NotAvailableLink feature="Compartilhar no X" className="grid size-[18px] place-items-center text-cream hover:text-amber">
        <TwitterIcon aria-hidden className="size-3.5" />
        <span className="sr-only">X (Twitter)</span>
      </NotAvailableLink>
    </div>
  )
}

export function NftStory({ nft }: { nft: Nft }) {
  return (
    <Tabs defaultValue="details" className="gap-3">
      <TabsList variant="line" className="h-auto w-full justify-start gap-8 rounded-none border-b border-copper/30 p-0">
        <TabsTrigger
          value="details"
          className="h-auto rounded-none px-0 pb-3 text-[17px] font-bold text-cream after:bg-copper data-[state=active]:bg-transparent data-[state=active]:text-amber"
        >
          Detalhes do NFT
        </TabsTrigger>
        <TabsTrigger
          value="reviews"
          className="h-auto rounded-none px-0 pb-3 text-[17px] font-normal text-cream after:bg-copper data-[state=active]:bg-transparent data-[state=active]:font-bold data-[state=active]:text-amber"
        >
          Avaliações de colecionadores ({nft.rating.count})
        </TabsTrigger>
      </TabsList>
      <TabsContent value="details" className="flex flex-col gap-3 text-sm leading-6">
        {nft.story.map((paragraph) => (
          <p key={paragraph} className="text-sand">
            {paragraph}
          </p>
        ))}
        <p className="font-bold text-cream">Rede:</p>
        <p className="text-sand">{nft.networkInfo}</p>
        <p className="font-bold text-cream">Contrato:</p>
        <p className="text-sand">
          {shortAddress(nft.contract.address)} • Contrato inteligente {nft.contract.standard} verificado.
        </p>
        <p className="font-bold text-cream">Royalties:</p>
        <p className="text-sand">
          O criador recebe {nft.contract.royaltiesPct}% de cada revenda (royalties), pagos automaticamente pelos mercados
          compatíveis.
        </p>
      </TabsContent>
      <TabsContent value="reviews" className="flex flex-col gap-3">
        <NftStars average={nft.rating.average} count={nft.rating.count} />
        <p className="text-sm leading-6 text-sand">
          As avaliações escritas dos colecionadores não fazem parte desta demonstração. A média {nft.rating.average.toFixed(1)}{' '}
          vem dos metadados do token.
        </p>
      </TabsContent>
    </Tabs>
  )
}
