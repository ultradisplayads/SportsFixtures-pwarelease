// Share functionality for viral growth

export interface ShareData {
  title: string
  text: string
  url: string
  image?: string
}

class ShareManager {
  // Check if native share is available
  public canShare(): boolean {
    return typeof navigator !== "undefined" && "share" in navigator
  }

  // Native share
  public async share(data: ShareData): Promise<boolean> {
    if (!this.canShare()) {
      console.log("[v0] Native share not supported")
      return false
    }

    try {
      await navigator.share({
        title: data.title,
        text: data.text,
        url: data.url,
      })
      console.log("[v0] Shared successfully")
      return true
    } catch (error) {
      // User cancelled or error occurred
      if ((error as Error).name !== "AbortError") {
        console.error("[v0] Share failed:", error)
      }
      return false
    }
  }

  // Share to WhatsApp
  public shareToWhatsApp(data: ShareData): void {
    const text = encodeURIComponent(`${data.text}\n${data.url}`)
    const whatsappUrl = `https://wa.me/?text=${text}`
    window.open(whatsappUrl, "_blank")
  }

  // Share to Twitter
  public shareToTwitter(data: ShareData): void {
    const text = encodeURIComponent(data.text)
    const url = encodeURIComponent(data.url)
    const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`
    window.open(twitterUrl, "_blank")
  }

  // Share to Facebook
  public shareToFacebook(data: ShareData): void {
    const url = encodeURIComponent(data.url)
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`
    window.open(facebookUrl, "_blank")
  }

  // Copy link to clipboard
  public async copyLink(url: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(url)
      console.log("[v0] Link copied to clipboard")
      return true
    } catch (error) {
      console.error("[v0] Failed to copy link:", error)
      return false
    }
  }

  // Generate match share data
  public getMatchShareData(homeTeam: string, awayTeam: string, matchId: string): ShareData {
    return {
      title: `${homeTeam} vs ${awayTeam}`,
      text: `Check out ${homeTeam} vs ${awayTeam} on Sports Fixtures!`,
      url: `${window.location.origin}/match/${matchId}`,
    }
  }
}

export const shareManager = new ShareManager()
