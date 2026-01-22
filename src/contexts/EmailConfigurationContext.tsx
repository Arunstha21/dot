"use client"

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react"
import { getEmailList, type from } from "@/server/sendgrid"
import { toast } from "sonner"

interface EmailConfiguration {
  senders: from[]
  selectedSender: string
  isLoading: boolean
}

interface EmailConfigurationContextType {
  config: EmailConfiguration
  setSelectedSender: (sender: string) => void
  refreshSenders: () => Promise<void>
}

const EmailConfigurationContext = createContext<EmailConfigurationContextType | undefined>(undefined)

const STORAGE_KEY = "email-configuration-sender"

interface EmailConfigurationProviderProps {
  children: ReactNode
}

export function EmailConfigurationProvider({ children }: EmailConfigurationProviderProps) {
  const [senders, setSenders] = useState<from[]>([])
  const [selectedSender, setSelectedSenderState] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  // Load selected sender from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setSelectedSenderState(stored)
      }
    } catch (error) {
      console.error("Failed to load sender selection from localStorage:", error)
    }
  }, [])

  // Fetch sender list on mount
  useEffect(() => {
    async function fetchSenders() {
      setIsLoading(true)
      try {
        const list = await getEmailList()
        setSenders(list)

        // Auto-select first sender if none selected and list is available
        if (!selectedSender && list.length > 0) {
          const firstSender = list[0].email
          setSelectedSenderState(firstSender)
          try {
            localStorage.setItem(STORAGE_KEY, firstSender)
          } catch (error) {
            console.error("Failed to save sender selection to localStorage:", error)
          }
        }
      } catch (error) {
        console.error("Failed to fetch senders:", error)
        toast.error("Unable to fetch sender list")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSenders()
  }, [])

  // Persist selected sender to localStorage
  const setSelectedSender = useCallback((sender: string) => {
    setSelectedSenderState(sender)
    try {
      localStorage.setItem(STORAGE_KEY, sender)
    } catch (error) {
      console.error("Failed to save sender selection to localStorage:", error)
    }
  }, [])

  // Manual refresh function
  const refreshSenders = useCallback(async () => {
    setIsLoading(true)
    try {
      const list = await getEmailList()
      setSenders(list)
      toast.success("Sender list refreshed")
    } catch (error) {
      console.error("Failed to refresh senders:", error)
      toast.error("Unable to refresh sender list")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const value: EmailConfigurationContextType = {
    config: {
      senders,
      selectedSender,
      isLoading,
    },
    setSelectedSender,
    refreshSenders,
  }

  return (
    <EmailConfigurationContext.Provider value={value}>
      {children}
    </EmailConfigurationContext.Provider>
  )
}

export function useEmailConfiguration() {
  const context = useContext(EmailConfigurationContext)
  if (context === undefined) {
    throw new Error("useEmailConfiguration must be used within EmailConfigurationProvider")
  }
  return context
}
