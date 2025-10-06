import { X } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface EmailChipProps {
  email: string
  onRemove: () => void
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
  className?: string
}

export function EmailChip({ email, onRemove, isSelected, onClick, className }: EmailChipProps) {
  const name = email.split('@')[0]
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()

  return (
    <TooltipProvider>
      <Tooltip delayDuration={400}>
        <TooltipTrigger asChild>
          <div 
            className={`inline-flex items-center gap-2 max-w-full rounded-full pr-2 mr-2 mb-2 cursor-pointer ${
              isSelected ? 'bg-primary text-primary-foreground' : 'bg-secondary'
            } ${className}`}
            onClick={onClick}
          >
            <Avatar className="h-6 w-6">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${name}`} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <span className="text-sm truncate">{name}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
              className="hover:bg-secondary-foreground/10 rounded-full p-1"
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Remove</span>
            </button>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{email}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
