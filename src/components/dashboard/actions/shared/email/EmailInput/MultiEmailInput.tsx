import React, { useState, KeyboardEvent, ChangeEvent, ClipboardEvent, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { EmailChip } from "./EmailChip"

interface MultiEmailInputProps {
  value: string[]
  onChange: (emails: string[]) => void
  placeholder?: string
  id?: string
  required?: boolean
}

export function MultiEmailInput({ value, onChange, placeholder, id, required }: MultiEmailInputProps) {
  const [currentInput, setCurrentInput] = useState("")
  const [selectedChips, setSelectedChips] = useState<number[]>([])
  const [isActive, setIsActive] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsActive(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const cmdKey = isMac ? e.metaKey : e.ctrlKey

    if ((e.key === 'Tab' || e.key === 'Enter') && currentInput) {
      e.preventDefault()
      addEmail()
    }
    if (e.key === 'Backspace') {
      if (!currentInput && value.length > 0) {
        if (selectedChips.length > 0) {
          removeSelectedChips()
        } else {
          onChange(value.slice(0, -1))
        }
      }
    }
    if (cmdKey && e.key === 'a') {
      e.preventDefault()
      setSelectedChips([...Array(value.length).keys()])
    }
    if (cmdKey && e.key === 'c' && selectedChips.length > 0) {
      e.preventDefault()
      const selectedEmails = selectedChips.map(index => value[index]).join(', ')
      navigator.clipboard.writeText(selectedEmails)
    }
  }

  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    if (input.includes(',') || input.includes(';')) {
      const emails = input.split(/[,;]/).map(e => e.trim()).filter(Boolean)
      const validEmail = emails[0]
      if (validEmail && isValidEmail(validEmail)) {
        addEmail(validEmail)
      } else {
        setCurrentInput(input.replace(/[,;]/g, ''))
      }
    } else {
      setCurrentInput(input)
    }
  }

  const addEmail = (emailToAdd: string = currentInput.trim()) => {
    if (emailToAdd && isValidEmail(emailToAdd) && !value.includes(emailToAdd)) {
      onChange([...value, emailToAdd])
      setCurrentInput('')
      if (document.activeElement !== inputRef.current) {
        setIsActive(false)
      } else {
        inputRef.current?.focus()
      }
    }
  }

  const removeEmail = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
    setSelectedChips(selectedChips.filter(i => i !== index).map(i => i > index ? i - 1 : i))
    inputRef.current?.focus()
  }

  const removeSelectedChips = () => {
    onChange(value.filter((_, index) => !selectedChips.includes(index)))
    setSelectedChips([])
    inputRef.current?.focus()
  }

  const handleChipClick = (index: number, e: React.MouseEvent) => {
    if (isMac ? e.metaKey : e.ctrlKey) {
      setSelectedChips(prev =>
        prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
      )
    } else {
      setSelectedChips([index])
    }
    e.stopPropagation()
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text')
    const emails = pastedText
      .split(/[\n,;\s]+/)
      .map(email => email.trim())
      .filter(email => email && isValidEmail(email))
      .filter(email => !value.includes(email))

    if (emails.length > 0) {
      onChange([...value, ...emails])
      if (document.activeElement !== inputRef.current) {
        setIsActive(false)
      } else {
        inputRef.current?.focus()
      }
    }
  }

  const handleContainerClick = (e: React.MouseEvent) => {
    setIsActive(true)
    inputRef.current?.focus()
    e.stopPropagation()
  }

  return (
    <div
      ref={containerRef}
      className="border rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 cursor-text"
      onClick={handleContainerClick}
    >
      <div className="flex flex-wrap gap-1 max-h-[120px] overflow-y-auto">
        {value.map((email, index) => (
          <EmailChip
            key={email}
            email={email}
            onRemove={() => removeEmail(index)}
            isSelected={selectedChips.includes(index)}
            onClick={(e) => handleChipClick(index, e)}
            className="scale-[0.82] origin-left"
          />
        ))}
        <Input
          ref={inputRef}
          type="email"
          value={currentInput}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={() => setIsActive(true)}
          onBlur={() => {
            setTimeout(() => {
              if (document.activeElement !== inputRef.current) {
                setIsActive(false)
              }
            }, 0)
          }}
          placeholder={isActive || value.length === 0 ? placeholder : ''}
          id={id}
          required={required && value.length === 0}
          className={`border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-sm h-6 ${
            isActive || value.length === 0 ? 'w-full min-w-[100px]' : 'w-0 min-w-0'
          }`}
        />
      </div>
    </div>
  )
}
