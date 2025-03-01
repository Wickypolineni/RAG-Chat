'use client'

import { Model } from '@/lib/types/models'
import { cn } from '@/lib/utils'
import { Message } from 'ai'
import { ArrowUp, MessageCirclePlus, Square } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import Textarea from 'react-textarea-autosize'
import { EmptyScreen } from './empty-screen'
import { ModelSelector } from './model-selector'
import { SearchModeToggle } from './search-mode-toggle'
import { Button } from './ui/button'
import { IconLogo } from './ui/icons'

interface ChatPanelProps {
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isLoading: boolean
  messages: Message[]
  setMessages: (messages: Message[]) => void
  query?: string
  stop: () => void
  append: (message: any) => void
  models?: Model[]
}

// Define the type for a video result item. Adjust properties based on Serper's response.
type SerperVideoResultItem = {
  title: string
  link: string
  thumbnail: string
  duration: string
}

export function ChatPanel({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  messages,
  setMessages,
  query,
  stop,
  append,
  models
}: ChatPanelProps) {
  const [showEmptyScreen, setShowEmptyScreen] = useState(false)
  const [responseType, setResponseType] = useState('Default')
  const [videoResults, setVideoResults] = useState<SerperVideoResultItem[]>([])
  const router = useRouter()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const isFirstRender = useRef(true)
  const [isComposing, setIsComposing] = useState(false)
  const [enterDisabled, setEnterDisabled] = useState(false)

  const handleCompositionStart = () => setIsComposing(true)

  const handleCompositionEnd = () => {
    setIsComposing(false)
    setEnterDisabled(true)
    setTimeout(() => {
      setEnterDisabled(false)
    }, 300)
  }

  const handleNewChat = () => {
    setMessages([])
    router.push('/')
  }

  // Helper function: Fetch videos from Serper API for the current query.
  const fetchSerperVideos = async (query: string) => {
    try {
      const myHeaders = new Headers()
      myHeaders.append('X-API-KEY', process.env.SERPER_API_KEY || '')
      myHeaders.append('Content-Type', 'application/json')

      const raw = JSON.stringify({
        q: query,
        gl: 'in'
      })

      const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow' as RequestRedirect
      }

      const response = await fetch(
        'https://google.serper.dev/videos',
        requestOptions
      )
      const data = await response.json()
      // Assuming the API returns the videos in data.videos; adjust as needed.
      return data.videos || []
    } catch (error) {
      console.error('Error fetching video results:', error)
      return []
    }
  }

  const lastQuery = useRef<string | null>(null)

  useEffect(() => {
    if (query && query.trim().length > 0 && lastQuery.current !== query) {
      lastQuery.current = query
      // Append the user's query once.
      append({
        role: 'user',
        content: query
      })

      const fetchVideos = async () => {
        try {
          const myHeaders = new Headers()
          myHeaders.append('X-API-KEY', process.env.SERPER_API_KEY || '')
          myHeaders.append('Content-Type', 'application/json')

          const raw = JSON.stringify({
            q: query,
            gl: 'in'
          })

          const requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: raw,
            redirect: 'follow' as RequestRedirect
          }

          const response = await fetch(
            'https://google.serper.dev/videos',
            requestOptions
          )
          const data = await response.json()
          const videos = Array.isArray(data.videos) ? data.videos : []

          // If the API doesn't return at least 5 videos, throw an error to trigger fallback.
          if (videos.length < 5) {
            throw new Error('Insufficient video results returned')
          } else {
            // Make sure only five videos are used.
            setVideoResults(videos.slice(0, 5))
          }
        } catch (error) {
          console.error('Error fetching video results:', error)
          // Fallback static video links
          const fallbackVideos: SerperVideoResultItem[] = [
            {
              title: 'Video 1',
              link: 'https://video1.example.com',
              thumbnail: 'https://via.placeholder.com/300x200?text=Video+1',
              duration: '3:45'
            },
            {
              title: 'Video 2',
              link: 'https://video2.example.com',
              thumbnail: 'https://via.placeholder.com/300x200?text=Video+2',
              duration: '2:30'
            },
            {
              title: 'Video 3',
              link: 'https://video3.example.com',
              thumbnail: 'https://via.placeholder.com/300x200?text=Video+3',
              duration: '4:15'
            },
            {
              title: 'Video 4',
              link: 'https://video4.example.com',
              thumbnail: 'https://via.placeholder.com/300x200?text=Video+4',
              duration: '5:00'
            },
            {
              title: 'Video 5',
              link: 'https://video5.example.com',
              thumbnail: 'https://via.placeholder.com/300x200?text=Video+5',
              duration: '1:30'
            }
          ]
          setVideoResults(fallbackVideos)
        }
      }
      fetchVideos()
    }
  }, [query, append])

  return (
    <div
      className={cn(
        'mx-auto w-full',
        messages.length > 0
          ? 'fixed bottom-0 left-0 right-0 bg-background'
          : 'fixed bottom-8 left-0 right-0 top-6 flex flex-col items-center justify-center'
      )}
    >
      {messages.length === 0 && (
        <div className="mb-8">
          <IconLogo className="size-12 text-muted-foreground" />
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className={cn(
          'max-w-3xl w-full mx-auto',
          messages.length > 0 ? 'px-2 py-4' : 'px-6'
        )}
      >
        <div className="relative flex flex-col w-full gap-2 bg-muted rounded-3xl border border-input">
          <Textarea
            ref={inputRef}
            name="input"
            rows={2}
            maxRows={5}
            tabIndex={0}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            placeholder="Ask a question..."
            spellCheck={false}
            value={input}
            className="resize-none w-full min-h-12 bg-transparent border-0 px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            onChange={e => {
              handleInputChange(e)
              setShowEmptyScreen(e.target.value.length === 0)
            }}
            onKeyDown={e => {
              if (
                e.key === 'Enter' &&
                !e.shiftKey &&
                !isComposing &&
                !enterDisabled
              ) {
                if (input.trim().length === 0) {
                  e.preventDefault()
                  return
                }
                e.preventDefault()
                const textarea = e.target as HTMLTextAreaElement
                textarea.form?.requestSubmit()
              }
            }}
            onFocus={() => setShowEmptyScreen(true)}
            onBlur={() => setShowEmptyScreen(false)}
          />

          {/* Bottom menu area */}
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <ModelSelector models={models || []} />
              <SearchModeToggle />
              {/* Updated dropdown for response type with rounded-full styling and bright text */}
              <select
                value={responseType}
                onChange={e => setResponseType(e.target.value)}
                className="rounded-full border border-input bg-background py-2 px-4 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="Default">Default (Simple)</option>
                <option value="Professional">Professional</option>
                <option value="Short">Short</option>
                <option value="Elaborate">Elaborate</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNewChat}
                  className="shrink-0 rounded-full group"
                  type="button"
                  disabled={isLoading}
                >
                  <MessageCirclePlus className="size-4 group-hover:rotate-12 transition-all" />
                </Button>
              )}
              <Button
                type={isLoading ? 'button' : 'submit'}
                size={'icon'}
                variant={'outline'}
                className={cn(isLoading && 'animate-pulse', 'rounded-full')}
                disabled={input.length === 0 && !isLoading}
                onClick={isLoading ? stop : undefined}
              >
                {isLoading ? <Square size={20} /> : <ArrowUp size={20} />}
              </Button>
            </div>
          </div>
        </div>
        {messages.length === 0 && (
          <EmptyScreen
            submitMessage={message => {
              handleInputChange({
                target: { value: message }
              } as React.ChangeEvent<HTMLTextAreaElement>)
            }}
            className={cn(showEmptyScreen ? 'visible' : 'invisible')}
          />
        )}
      </form>
      {/* Video Sources Display */}
      {videoResults.length > 0 && (
        <div className="p-3 bg-background rounded-lg mt-3 max-w-3xl mx-auto">
          <h2 className="text-md font-bold text-foreground mb-2">
            Video Results
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {videoResults.map((video, idx) => (
              <a
                key={idx}
                href={video.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center"
              >
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-auto rounded-lg"
                />
                <p className="mt-1 text-sm text-foreground text-center">
                  {video.title}
                </p>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
