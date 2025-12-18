"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useComponentPhotos } from "@/lib/hooks/useComponentPhotos"

interface Card {
  id: number
  contentType: 1 | 2 | 3
}

interface CardData {
  title: string
  description: string
  image: string
}

const defaultCardData: Record<number, CardData> = {
  1: {
    title: "Dithered Flowers",
    description: "Digital Nostalgia",
    image: "https://cdn.cosmos.so/c4ab6b73-e14f-455b-b402-ef3db0708854?format=jpeg",
  },
  2: {
    title: "Color Blur",
    description: "Abstract Hues",
    image: "https://cdn.cosmos.so/4c494ddd-a067-4bd0-bdb5-5be384ba4f20?format=jpeg",
  },
  3: {
    title: "Metal Reflection",
    description: "Industrial Sheen",
    image: "https://cdn.cosmos.so/c24a0353-afd3-43e1-89b2-bbe03a3f6712?format=jpeg",
  },
}

const initialCards: Card[] = [
  { id: 1, contentType: 1 },
  { id: 2, contentType: 2 },
  { id: 3, contentType: 3 },
]

const positionStyles = [
  { scale: 1, y: 12 },
  { scale: 0.95, y: -16 },
  { scale: 0.9, y: -44 },
]

const exitAnimation = {
  y: 420,
  scale: 1,
  opacity: 0,
  zIndex: 10,
}

const enterAnimation = {
  y: -16,
  scale: 0.9,
  opacity: 0,
}

function CardContent({ contentType, cardData }: { contentType: 1 | 2 | 3; cardData: Record<number, CardData> }) {
  const data = cardData[contentType]

  return (
    <div className="flex h-full w-full flex-col gap-4">
      <div className="-outline-offset-1 flex h-[280px] w-full items-center justify-center overflow-hidden rounded-lg outline outline-black/10 dark:outline-white/10">
        <img
          src={data.image || "/placeholder.svg"}
          alt={data.title}
          className="h-full w-full select-none object-cover"
        />
      </div>
      <div className="flex w-full items-center justify-between gap-2 px-3 pb-6">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-medium text-foreground">{data.title}</span>
          <span className="text-muted-foreground">{data.description}</span>
        </div>
        <button className="flex h-10 shrink-0 cursor-pointer select-none items-center gap-0.5 rounded-full bg-foreground pl-4 pr-3 text-sm font-medium text-background">
          Read
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="square"
          >
            <path d="M9.5 18L15.5 12L9.5 6" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function AnimatedCard({
  card,
  index,
  isAnimating,
  cardData,
}: {
  card: Card
  index: number
  isAnimating: boolean
  cardData: Record<number, CardData>
}) {
  const { scale, y } = positionStyles[index] ?? positionStyles[2]
  const zIndex = index === 0 && isAnimating ? 10 : 3 - index

  const exitAnim = index === 0 ? exitAnimation : undefined
  const initialAnim = index === 2 ? enterAnimation : undefined

  return (
    <motion.div
      key={card.id}
      initial={initialAnim}
      animate={{ y, scale, opacity: 1 }}
      exit={exitAnim}
      transition={{
        type: "spring",
        duration: 1,
        bounce: 0,
        opacity: { duration: 0.6, ease: "easeInOut" },
      }}
      style={{
        zIndex,
        left: "50%",
        x: "-50%",
        bottom: 0,
      }}
      className="absolute flex h-[360px] w-[420px] items-center justify-center overflow-hidden rounded-t-xl border-x border-t border-border bg-card p-1 shadow-lg will-change-transform sm:w-[680px]"
    >
      <CardContent contentType={card.contentType} cardData={cardData} />
    </motion.div>
  )
}

export default function AnimatedCardStack() {
  const [cards, setCards] = useState(initialCards)
  const [isAnimating, setIsAnimating] = useState(false)
  const [nextId, setNextId] = useState(4)
  const [isPlaying, setIsPlaying] = useState(true)
  const [cardData, setCardData] = useState<Record<number, CardData>>(defaultCardData)

  // Load photos using custom hook
  const { photos } = useComponentPhotos("AnimatedCardStack")

  useEffect(() => {
    if (photos.length > 0) {
      const apiCardData: Record<number, CardData> = {}
      photos.slice(0, 3).forEach((item, index) => {
        apiCardData[index + 1] = {
          title: item.props.caption || item.photo.title,
          description: item.props.alt || "Photo",
          image: item.photo.imageUrl,
        }
      })
      setCardData({ ...defaultCardData, ...apiCardData })
    }
  }, [photos])

  const handleAnimate = () => {
    setIsAnimating(true)

    const nextContentType = ((cards[2].contentType % 3) + 1) as 1 | 2 | 3

    setCards([...cards.slice(1), { id: nextId, contentType: nextContentType }])
    setNextId((prev) => prev + 1)
    setIsAnimating(false)
  }

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      handleAnimate()
    }, 3000) // Rotate every 3 seconds

    return () => clearInterval(interval)
  }, [cards, isPlaying, nextId])

  return (
    <div className="flex w-full flex-col items-center justify-center pt-2">
      <div className="relative h-[500px] w-full overflow-hidden sm:w-[800px]">
        <AnimatePresence initial={false}>
          {cards.slice(0, 3).map((card, index) => (
            <AnimatedCard key={card.id} card={card} index={index} isAnimating={isAnimating} cardData={cardData} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
