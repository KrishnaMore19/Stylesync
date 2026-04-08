const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || ''

export async function scrapeWebsite(url) {
  const res = await fetch(`${BASE_URL}/api/scrape`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Scrape failed')
  return data
}

export async function fetchTokens(tokenId) {
  const res = await fetch(`${BASE_URL}/api/tokens?tokenId=${tokenId}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to fetch tokens')
  return data
}

export async function updateToken(tokenId, path, value) {
  const res = await fetch(`${BASE_URL}/api/tokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tokenId, path, value }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Update failed')
  return data
}

export async function toggleLock(tokenId, tokenPath, value, lock) {
  const res = await fetch(`${BASE_URL}/api/lock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tokenId, tokenPath, value, lock }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Lock failed')
  return data
}
