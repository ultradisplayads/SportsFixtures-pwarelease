import { searchTeams, searchPlayers } from "@/app/actions/sports-api"
import { HeaderMenu } from "@/components/header-menu"
import { BottomNav } from "@/components/bottom-nav"
import { SearchResults } from "@/components/search-results"
import { Suspense } from "react"
import { SkeletonLoader } from "@/components/skeleton-loader"

export default function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <HeaderMenu />

      <div className="flex-1 overflow-auto pb-20">
        <div className="border-b border-border bg-card p-4">
          <h1 className="text-xl font-bold">Search Results</h1>
          {searchParams.q && <p className="mt-1 text-sm text-muted-foreground">Results for "{searchParams.q}"</p>}
        </div>

        {searchParams.q ? (
          <Suspense fallback={<SkeletonLoader count={6} />}>
            <SearchContent query={searchParams.q} />
          </Suspense>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <p className="text-muted-foreground">Enter a search term to find teams, players, and leagues</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

async function SearchContent({ query }: { query: string }) {
  const [teams, players] = await Promise.all([searchTeams(query), searchPlayers(query)])

  return <SearchResults teams={teams} players={players} query={query} />
}
