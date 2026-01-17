import { Pencil, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface FloatingEditButtonProps {
  isEditing: boolean;
  onToggleEdit: () => void;
}

export default function FloatingEditButton({ isEditing, onToggleEdit }: FloatingEditButtonProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {isEditing ? (
        <button
          onClick={onToggleEdit}
          className={cn(
            "p-4 rounded-2xl shadow-lg transition-all duration-300",
            "bg-brown-600 text-white hover:bg-brown-700",
          )}
        >
          <Check className="w-6 h-6" />
        </button>
      ) : (
        <button
          onClick={onToggleEdit}
          className={cn(
            "p-4 rounded-2xl shadow-lg transition-all duration-300",
            "bg-brown-600 text-white hover:bg-brown-700",
            "hover:shadow-xl hover:-translate-y-1",
          )}
        >
          <Pencil className="w-6 h-6" />
        </button>
      )}
    </div>
  )
}
