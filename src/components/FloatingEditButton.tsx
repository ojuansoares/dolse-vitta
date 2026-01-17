import { Pencil, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface FloatingEditButtonProps {
  isEditing: boolean
  onToggleEdit: () => void
  onSave?: () => void
  onCancel?: () => void
  hasChanges?: boolean
}

export default function FloatingEditButton({
  isEditing,
  onToggleEdit,
  onSave,
  onCancel,
  hasChanges,
}: FloatingEditButtonProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {isEditing ? (
        <>
          {/* Save button */}
          {hasChanges && onSave && (
            <button
              onClick={onSave}
              className={cn(
                "p-4 rounded-2xl shadow-lg transition-all duration-300",
                "bg-green-500 text-white hover:bg-green-600",
                "animate-scale-in",
              )}
            >
              <Check className="w-6 h-6" />
            </button>
          )}

          {/* Cancel/Done button */}
          <button
            onClick={onCancel || onToggleEdit}
            className={cn(
              "p-4 rounded-2xl shadow-lg transition-all duration-300",
              hasChanges ? "bg-red-500 text-white hover:bg-red-600" : "bg-brown-600 text-white hover:bg-brown-700",
            )}
          >
            {hasChanges ? <X className="w-6 h-6" /> : <Check className="w-6 h-6" />}
          </button>
        </>
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
