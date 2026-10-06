import { HttpResponse } from 'msw'
import { route } from '../network'
import { featured, findNft, listNfts, parseListParams, relatedNfts } from '../domain/catalog'
import { toNft } from '../domain/serializers'

export const catalogHandlers = [
  route('get', '/nfts', ({ request }) => HttpResponse.json(listNfts(parseListParams(new URL(request.url))))),
  route('get', '/nfts/featured', () => HttpResponse.json(featured())),
  route<{ id: string }>('get', '/nfts/:id', ({ params }) => HttpResponse.json({ nft: toNft(findNft(params.id)) })),
  route<{ id: string }>('get', '/nfts/:id/related', ({ params }) => HttpResponse.json({ items: relatedNfts(params.id) })),
]
