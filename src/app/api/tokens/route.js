import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db/prisma'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const tokenId = searchParams.get('tokenId')

    if (!tokenId) return NextResponse.json({ error: 'tokenId required' }, { status: 400 })

    const prisma = getPrisma()
    const token = await prisma.designToken.findUnique({
      where: { id: tokenId },
      include: {
        lockedTokens: true,
        site: { select: { url: true, title: true, favicon: true, extractionStatus: true } },
      },
    })

    if (!token) return NextResponse.json({ error: 'Token not found' }, { status: 404 })

    return NextResponse.json({ token })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { tokenId, path, value } = body

    if (!tokenId || !path) return NextResponse.json({ error: 'tokenId and path required' }, { status: 400 })

    const prisma = getPrisma()
    const token = await prisma.designToken.findUnique({ where: { id: tokenId } })
    if (!token) return NextResponse.json({ error: 'Token not found' }, { status: 404 })

    // Get old value for version history
    const pathParts = path.split('.')
    let oldValue = token[pathParts[0]]
    if (pathParts.length > 1 && oldValue) {
      oldValue = pathParts.slice(1).reduce((obj, key) => obj?.[key], oldValue)
    }

    // Update the specific token path
    const [category, ...rest] = pathParts
    const currentData = token[category] || {}
    const updated = setNestedValue(currentData, rest, value)

    await prisma.designToken.update({
      where: { id: tokenId },
      data: { [category]: updated },
    })

    // Record version history
    await prisma.versionHistory.create({
      data: {
        tokenId,
        tokenPath: path,
        beforeValue: oldValue ?? null,
        afterValue: value,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function setNestedValue(obj, pathArr, value) {
  if (pathArr.length === 0) return value
  const [head, ...tail] = pathArr
  return { ...obj, [head]: setNestedValue(obj[head] || {}, tail, value) }
}
