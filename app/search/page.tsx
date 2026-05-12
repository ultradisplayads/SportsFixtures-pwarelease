import { searchTeams, searchPlayers } from "@/app/actions/sports-api"
import { globalSearch } from "@/app/actions/global-search"
import { HeaderMenu } from "@/components/header-menu"
import { BottomNav } from "@/components/bottom-nav"
import { SearchResults } from "@/components/search-results"
import { Suspense } from "react"
import { SkeletonLoader } from "@/components/skeleton-loader"

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <HeaderMenu />

      <div className="flex-1 overflow-auto pb-20">
        <div className="border-b border-border bg-card p-4">
          <h1 className="text-xl font-bold">Search Results</h1>
          {params.q && <p className="mt-1 text-sm text-muted-foreground">Results for "{params.q}"</p>}
        </div>

        {params.q ? (
          <Suspense fallback={<SkeletonLoader count={6} />}>
            <SearchContent query={params.q} />
          </Suspense>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <p className="text-muted-foreground">Enter a search term to find sports, countries, leagues, events, venues, offers, teams and players</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

async function SearchContent({ query }: { query: string }) {
  const [teams, players, global] = await Promise.all([searchTeams(query), searchPlayers(query), globalSearch(query)])

  return <SearchResults teams={teams} players={players} global={global} query={query} />
}
