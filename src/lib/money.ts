import Decimal from 'decimal.js'

Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP })

export type EthString = string

export const eth = (value: EthString | number | Decimal) => new Decimal(value)

/** Serializa para string decimal sem notação científica nem zeros à direita. */
export const toEthString = (value: Decimal): EthString => {
  const fixed = value.toDecimalPlaces(18).toFixed()
  return fixed.includes('.') ? fixed.replace(/0+$/, '').replace(/\.$/, '') : fixed
}

export const addEth = (...values: EthString[]): EthString =>
  toEthString(values.reduce((acc, v) => acc.plus(v), new Decimal(0)))

export const mulEth = (value: EthString, quantity: number): EthString => {
  if (!Number.isInteger(quantity)) throw new Error('Quantidade deve ser inteira')
  return toEthString(new Decimal(value).times(quantity))
}

export const subEth = (a: EthString, b: EthString): EthString => toEthString(Decimal.max(new Decimal(a).minus(b), 0))

export const compareEth = (a: EthString, b: EthString) => new Decimal(a).comparedTo(b)

/**
 * Formata como no Figma: "1.19 ETH", "26.846 ETH", "0.016 ETH".
 * Mantém no mínimo 2 casas e preserva as casas significativas da API (sem arredondar).
 */
export function formatEth(value: EthString, { unit = true }: { unit?: boolean } = {}) {
  const d = new Decimal(value)
  const decimals = Math.max(2, d.decimalPlaces())
  const text = d.toFixed(decimals)
  return unit ? `${text} ETH` : text
}

/** Faixa de preço exibida no filtro: "0,02 - 12,30 ETH" (vírgula decimal, como no layout). */
export const formatEthPtBr = (value: EthString) => new Decimal(value).toFixed(2).replace('.', ',')
