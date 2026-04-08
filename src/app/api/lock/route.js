import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db/prisma'

export async function POST(request) {
  try {
    const { tokenId, tokenPath, value, lock } = await request.json()

    if (!tokenId || !tokenPath) {
      return NextResponse.json({ error: 'tokenId and tokenPath required' }, { status: 400 })
    }

    const prisma = getPrisma()

    if (lock) {
      // Lock the token
      await prisma.lockedToken.upsert({
        where: { tokenId_tokenPath: { tokenId, tokenPath } },
        update: { lockedValue: value },
        create: { tokenId, tokenPath, lockedValue: value },
      })
      return NextResponse.json({ success: true, locked: true })
    } else {
      // Unlock the token
      await prisma.lockedToken.deleteMany({
        where: { tokenId, tokenPath },
      })
      return NextResponse.json({ success: true, locked: false })
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const tokenId = searchParams.get('tokenId')

    const prisma = getPrisma()
    const lockedTokens = await prisma.lockedToken.findMany({
      where: { tokenId },
    })

    return NextResponse.json({ lockedTokens })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
