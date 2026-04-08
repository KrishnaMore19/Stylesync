import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db/prisma'
import { exportTokens } from '@/lib/tokens/export'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const tokenId = searchParams.get('tokenId')
    const format = searchParams.get('format') || 'css' // css | json | tailwind

    const prisma = getPrisma()
    const token = await prisma.designToken.findUnique({
      where: { id: tokenId },
      include: { lockedTokens: true },
    })

    if (!token) return NextResponse.json({ error: 'Token not found' }, { status: 404 })

    const output = exportTokens(token, format)

    const contentTypes = {
      css: 'text/css',
      json: 'application/json',
      tailwind: 'application/javascript',
    }

    return new NextResponse(output, {
      headers: {
        'Content-Type': contentTypes[format] || 'text/plain',
        'Content-Disposition': `attachment; filename="design-tokens.${format === 'json' ? 'json' : format === 'tailwind' ? 'js' : 'css'}"`,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
