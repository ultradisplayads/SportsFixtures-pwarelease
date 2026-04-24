import { SkeletonLoader } from "@/components/skeleton-loader"

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SkeletonLoader count={8} />
    </div>
  )
}
