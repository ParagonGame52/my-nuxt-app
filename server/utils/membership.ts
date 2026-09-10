export function calculateTier(totalSpent: number, currentTier?: string): string {
  // If the user already has admin-exclusive Diamond tier, preserve it
  if (currentTier && currentTier.toLowerCase() === 'diamond') {
    return 'diamond'
  }
  if (totalSpent >= 15000) return 'platinum'
  if (totalSpent >= 5000) return 'gold'
  if (totalSpent >= 1000) return 'silver'
  return 'bronze'
}

export function getPointsMultiplier(tier: string): number {
  switch (tier.toLowerCase()) {
    case 'diamond': return 10
    case 'platinum': return 5
    case 'gold': return 3
    case 'silver': return 2
    default: return 1
  }
}

export function getTierDiscount(tier: string): number {
  switch (tier.toLowerCase()) {
    case 'diamond': return 0.25 // 25% Admin Exclusive Discount
    case 'platinum': return 0.15 // 15%
    case 'gold': return 0.10 // 10%
    case 'silver': return 0.05 // 5%
    default: return 0
  }
}

export function calculateEarnedPoints(price: number, tier: string): number {
  const multiplier = getPointsMultiplier(tier)
  return Math.floor(price / 100) * multiplier
}
