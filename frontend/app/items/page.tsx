'use client'

import { Suspense } from 'react'
import LoadingSpinner from '@/components/common/LoadingSpinner'

import ItemsContent from '@/components/items/ItemsContent'

export default function ItemsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading item database...</p>
        </div>
      </div>
    }>
      <ItemsContent />
    </Suspense>
  )
}
