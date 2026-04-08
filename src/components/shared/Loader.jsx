'use client'
import { motion } from 'framer-motion'

export default function Loader({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-64 gap-6">
      {/* DOM tree parsing animation */}
      <div className="w-48 space-y-2">
        {[100, 75, 90, 60, 80].map((w, i) => (
          <motion.div
            key={i}
            className="h-1.5 rounded-full skeleton"
            style={{ width: `${w}%` }}
            initial={{ scaleX: 0, transformOrigin: 'left' }}
            animate={{ scaleX: 1 }}
            transition={{ delay: i * 0.12, duration: 0.4, ease: 'easeOut' }}
          />
        ))}
      </div>
      <p className="text-xs animate-pulse" style={{ color: 'var(--app-text-muted)', fontFamily: 'var(--font-mono)' }}>
        {message}
      </p>
    </div>
  )
}
