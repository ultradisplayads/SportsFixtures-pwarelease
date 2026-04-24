"use client"

import { Share2, MessageCircle, Twitter, Facebook, Copy } from "lucide-react"
import { useState } from "react"
import { shareManager, type ShareData } from "@/lib/share-manager"
import { triggerHaptic } from "@/lib/haptic-feedback"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface ShareButtonProps {
  shareData: ShareData
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
}

export function ShareButton({ shareData, variant = "ghost", size = "icon" }: ShareButtonProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)

  const handleNativeShare = async () => {
    triggerHaptic("medium")
    const success = await shareManager.share(shareData)
    if (success) {
      setIsOpen(false)
    }
  }

  const handleWhatsApp = () => {
    triggerHaptic("light")
    shareManager.shareToWhatsApp(shareData)
    setIsOpen(false)
  }

  const handleTwitter = () => {
    triggerHaptic("light")
    shareManager.shareToTwitter(shareData)
    setIsOpen(false)
  }

  const handleFacebook = () => {
    triggerHaptic("light")
    shareManager.shareToFacebook(shareData)
    setIsOpen(false)
  }

  const handleCopyLink = async () => {
    triggerHaptic("light")
    const success = await shareManager.copyLink(shareData.url)
    if (success) {
      toast({
        title: "Link copied!",
        description: "Share link copied to clipboard",
      })
      setIsOpen(false)
    } else {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      })
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size}>
          <Share2 className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {shareManager.canShare() && (
          <DropdownMenuItem onClick={handleNativeShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleWhatsApp}>
          <MessageCircle className="mr-2 h-4 w-4" />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleTwitter}>
          <Twitter className="mr-2 h-4 w-4" />
          Twitter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleFacebook}>
          <Facebook className="mr-2 h-4 w-4" />
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink}>
          <Copy className="mr-2 h-4 w-4" />
          Copy Link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
