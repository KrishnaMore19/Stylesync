'use client'
import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTokenStore } from '@/store/tokenStore'
import Sidebar from '@/components/dashboard/Sidebar'
import Header from '@/components/dashboard/Header'
import TokenPanel from '@/components/dashboard/TokenPanel'
import ComponentGrid from '@/components/preview/ComponentGrid'
import Loader from '@/components/shared/Loader'

function DashboardContent() {
  const searchParams = useSearchParams()
  const siteId = searchParams.get('siteId')
  const tokenId = searchParams.get('tokenId')
  const { loadTokens, activeTab } = useTokenStore()

  useEffect(() => {
    if (tokenId) loadTokens(tokenId)
  }, [tokenId])

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--app-bg)' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header siteId={siteId} tokenId={tokenId} />
        <div className="flex-1 flex overflow-hidden">
          {/* Token Editor Panel */}
          <div className="w-80 flex-shrink-0 overflow-y-auto border-r" style={{ borderColor: 'var(--app-border)' }}>
            <TokenPanel tokenId={tokenId} />
          </div>
          {/* Preview Panel */}
          <div className="flex-1 overflow-y-auto">
            <ComponentGrid />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<Loader message="Loading dashboard..." />}>
      <DashboardContent />
    </Suspense>
  )
}
