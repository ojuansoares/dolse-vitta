import type React from "react"

import { useState, useEffect } from "react"
import { X, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface Field {
  key: string
  label: string
  type: "text" | "textarea" | "number" | "checkbox" | "email" | "phone" | "url" | "instagram" | "currency"
  value: string | number | boolean
  placeholder?: string
  required?: boolean
}

interface EditModalProps {
  title: string
  onClose: () => void
  onSave: (data: Record<string, string | number | boolean>) => void
  fields: Field[]
}

// Validation functions
const validateEmail = (email: string): boolean => {
  if (!email) return true // Optional field
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validatePhone = (phone: string): boolean => {
  if (!phone) return true // Optional field
  // Accept: (11) 99999-9999, 11999999999, +55 11 99999-9999, etc.
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length >= 10 && cleaned.length <= 11
}

// Format phone as (99) 99999-9999
const formatPhone = (value: string): string => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '')
  
  // Limita a 11 dígitos
  const limited = numbers.slice(0, 11)
  
  // Aplica a máscara
  if (limited.length <= 2) {
    return limited.length > 0 ? `(${limited}` : ''
  } else if (limited.length <= 7) {
    return `(${limited.slice(0, 2)}) ${limited.slice(2)}`
  } else {
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`
  }
}

const validateUrl = (url: string): boolean => {
  if (!url) return true // Optional field
  try {
    new URL(url)
    return true
  } catch {
    // Also accept URLs without protocol
    if (url.match(/^[\w.-]+\.(com|net|org|br|io|app|dev|co)(\/.*)?$/i)) {
      return true
    }
    return false
  }
}

const validateInstagram = (instagram: string): boolean => {
  if (!instagram) return true // Optional field
  return instagram.startsWith('@')
}

export default function EditModal({ title, onClose, onSave, fields }: EditModalProps) {
  const [formData, setFormData] = useState<Record<string, string | number | boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const initial: Record<string, string | number | boolean> = {}
    fields.forEach((field) => {
      initial[field.key] = field.value ?? ""
    })
    setFormData(initial)
  }, [fields])

  // Format currency as 0,00 and allow only numbers
  const formatCurrency = (value: string): string => {
    const numbers = value.replace(/\D/g, "")
    if (!numbers) return ""
    const cents = numbers.padStart(3, "0")
    const intPart = cents.slice(0, -2)
    const decimalPart = cents.slice(-2)
    return `${parseInt(intPart, 10)},${decimalPart}`.replace(/^0+(?!,)/, "")
  }

  const parseCurrency = (value: string): number => {
    if (!value) return 0
    return parseFloat(value.replace(/\./g, "").replace(",", "."))
  }

  const handleChange = (key: string, value: string | number | boolean, fieldType?: string) => {
    let processedValue = value
    if (fieldType === 'phone' && typeof value === 'string') {
      processedValue = formatPhone(value)
    }
    if (fieldType === 'currency' && typeof value === 'string') {
      processedValue = formatCurrency(value)
    }
    setFormData((prev) => ({ ...prev, [key]: processedValue }))
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: "" }))
    }
  }

  const validateField = (field: Field, value: string | number | boolean): string => {
    const strValue = String(value || "")
    
    if (field.required && (strValue === "" || strValue === undefined || strValue === null)) {
      return "Campo obrigatório"
    }
    switch (field.type) {
      case "email":
        if (!validateEmail(strValue)) return "Email inválido"
        break
      case "phone":
        if (!validatePhone(strValue)) return "Telefone inválido (mín. 10 dígitos)"
        break
      case "url":
        if (!validateUrl(strValue)) return "URL inválida"
        break
      case "instagram":
        if (strValue && !validateInstagram(strValue)) return "Instagram deve começar com @"
        break
    }
    return ""
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Validate all fields
    const newErrors: Record<string, string> = {}
    let hasErrors = false
    fields.forEach((field) => {
      const error = validateField(field, formData[field.key])
      if (error) {
        newErrors[field.key] = error
        hasErrors = true
      }
    })
    if (hasErrors) {
      setErrors(newErrors)
      return
    }
    // Convert currency field to number before saving
    const dataToSave = { ...formData }
    fields.forEach((field) => {
      if (field.type === 'currency') {
        dataToSave[field.key] = parseCurrency(formData[field.key] as string)
      }
    })
    onSave(dataToSave)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-border bg-white rounded-t-2xl">
          <h2 className="font-serif text-xl font-bold text-foreground">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-brown-500/10 transition-all duration-300">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {fields.map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-foreground mb-2">{field.label}</label>

              {field.type === "textarea" ? (
                <textarea
                  value={formData[field.key] as string}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border border-border bg-cream-50",
                    "focus:outline-none focus:ring-2 focus:ring-brown-500/30 focus:border-brown-500",
                    "transition-all duration-300 resize-none",
                  )}
                  rows={3}
                />
              ) : field.type === "checkbox" ? (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData[field.key] as boolean}
                    onChange={(e) => handleChange(field.key, e.target.checked)}
                    className="w-5 h-5 rounded border-border text-brown-600 focus:ring-brown-500"
                  />
                  <span className="text-sm text-muted-foreground">Ativo</span>
                </label>
              ) : field.type === "currency" ? (
                <input
                  type="text"
                  inputMode="numeric"
                  value={formData[field.key] as string}
                  onChange={(e) => handleChange(field.key, e.target.value, field.type)}
                  placeholder={field.placeholder || "0,00"}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border bg-cream-50",
                    "focus:outline-none focus:ring-2 focus:ring-brown-500/30 focus:border-brown-500",
                    "transition-all duration-300",
                    errors[field.key] ? "border-red-400 focus:ring-red-500/30 focus:border-red-500" : "border-border",
                  )}
                />
              ) : (
                <input
                  type={field.type === "email" ? "email" : field.type === "phone" ? "tel" : field.type === "url" ? "url" : field.type === "instagram" ? "text" : field.type}
                  value={formData[field.key] as string | number}
                  onChange={(e) =>
                    handleChange(
                      field.key,
                      field.type === "number" ? Number.parseFloat(e.target.value) || 0 : e.target.value,
                      field.type,
                    )
                  }
                  placeholder={field.placeholder}
                  step={field.type === "number" ? "0.01" : undefined}
                  maxLength={field.type === "phone" ? 15 : undefined}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border bg-cream-50",
                    "focus:outline-none focus:ring-2 focus:ring-brown-500/30 focus:border-brown-500",
                    "transition-all duration-300",
                    errors[field.key] ? "border-red-400 focus:ring-red-500/30 focus:border-red-500" : "border-border",
                  )}
                />
              )}
              
              {/* Error message */}
              {errors[field.key] && (
                <div className="flex items-center gap-1.5 mt-1.5 text-red-500 text-sm">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors[field.key]}</span>
                </div>
              )}
            </div>
          ))}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={cn(
                "flex-1 px-4 py-3 rounded-xl border border-border",
                "text-foreground font-medium",
                "hover:bg-cream-100 transition-all duration-300",
              )}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={cn(
                "flex-1 px-4 py-3 rounded-xl",
                "bg-brown-600 text-white font-medium",
                "hover:bg-brown-700 transition-all duration-300",
              )}
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
