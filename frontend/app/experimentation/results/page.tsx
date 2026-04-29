import { Suspense } from 'react'
import { ResultsContent } from './results-content'

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 flex items-center justify-center">
          <p>Loading...</p>
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  )
}
