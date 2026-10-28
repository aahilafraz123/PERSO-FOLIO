import { ArrowUpRight } from "lucide-react"
import { BrandIcon } from "@/components/BrandIcon"
import { RevealText } from "@/motion/RevealText"
import { profile } from "@/content/profile"

/** Closing call to action for the music chapter: follow the artist, with Spotify's own player alongside. */
export function Follow() {
  return (
    <div className="grid items-center gap-14 lg:grid-cols-[1fr_1fr] lg:gap-20">
      <div>
        <RevealText as="h2" split="lines" className="display-lg text-balance">
          Follow <span className="text-[var(--track-accent)] transition-colors">{profile.artistName}</span>.
        </RevealText>
        <p className="mt-6 max-w-md text-lg text-muted-foreground">New releases go to Spotify and Apple Music first. Follow there to hear them on the day they drop.</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <a
            href={profile.links.spotify}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex h-12 items-center gap-2.5 rounded-full bg-foreground px-6 text-[15px] font-semibold text-background transition-transform hover:scale-[1.03]"
          >
            <BrandIcon name="spotify" className="text-[#1db954]" /> Follow on Spotify
            <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
          <a
            href={profile.links.appleMusic}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex h-12 items-center gap-2.5 rounded-full border border-hairline px-6 text-[15px] font-semibold transition-colors hover:border-[#fa243c]/60 hover:bg-[#fa243c]/10"
          >
            <BrandIcon name="applemusic" className="text-[#fa243c]" /> Apple Music
            <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
        </div>
      </div>
      <div className="overflow-hidden rounded-[24px] border border-hairline bg-[#121212] shadow-[0_40px_100px_-30px_rgb(0_0_0/0.9)]">
        <iframe
          title="Azrael on Spotify"
          src={profile.embeds.spotifyArtist}
          className="block h-[452px] w-full"
          loading="lazy"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        />
      </div>
    </div>
  )
}
