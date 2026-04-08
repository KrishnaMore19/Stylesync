'use client'

export default function EmptyState({ icon = '✦', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-64 p-8 text-center">
      <div className="text-3xl mb-4 opacity-30">{icon}</div>
      {title && (
        <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--app-text)', fontFamily: 'var(--font-body)' }}>
          {title}
        </h3>
      )}
      {description && (
        <p className="text-xs mb-4 max-w-xs" style={{ color: 'var(--app-text-muted)', fontFamily: 'var(--font-body)', lineHeight: '1.6' }}>
          {description}
        </p>
      )}
      {action}
    </div>
  )
}
