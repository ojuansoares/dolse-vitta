"use client"

import { useState, useEffect } from "react"
import { MapPin, Phone, Mail, Instagram, Clock, Truck } from "lucide-react"
import { aboutApi } from "../services/api"
import { useAuth } from "../hooks/useAuth"
import FloatingEditButton from "../components/FloatingEditButton"
import EditModal from "../components/EditModal"

interface AboutData {
  id: string
  ab_name: string
  ab_photo_url?: string
  ab_title?: string
  ab_story?: string
  ab_specialty?: string
  ab_experience_years?: number
  ab_quote?: string
  ab_instagram?: string
  ab_whatsapp?: string
  ab_email?: string
  ab_city?: string
  ab_accepts_orders?: boolean
  ab_delivery_areas?: string
}

export default function About() {
  const { user } = useAuth()
  const [about, setAbout] = useState<AboutData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Admin editing state
  const [isEditing, setIsEditing] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)

  useEffect(() => {
    fetchAbout()
  }, [])

  const fetchAbout = async () => {
    try {
      setLoading(true)
      const data = await aboutApi.get()
      setAbout(Array.isArray(data) ? data[0] : data)
    } catch (err) {
      console.error("Error fetching about:", err)
      setError("Erro ao carregar informações")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (data: Record<string, string | number | boolean>) => {
    try {
      await aboutApi.update({
        name: data.ab_name as string,
        photo_url: data.ab_photo_url as string,
        title: data.ab_title as string,
        story: data.ab_story as string,
        specialty: data.ab_specialty as string,
        experience_years: data.ab_experience_years as number,
        quote: data.ab_quote as string,
        instagram: data.ab_instagram as string,
        whatsapp: data.ab_whatsapp as string,
        email: data.ab_email as string,
        city: data.ab_city as string,
        accepts_orders: data.ab_accepts_orders as boolean,
        delivery_areas: data.ab_delivery_areas as string,
      })
      setEditModalOpen(false)
      fetchAbout()
    } catch (err) {
      console.error("Error saving about:", err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-brown-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !about) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-muted-foreground">{error || "Informações não disponíveis"}</p>
      </div>
    )
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Hero */}
      <div className="text-center mb-12 animate-fade-in">
        {/* Photo */}
        <div className="relative w-40 h-40 mx-auto mb-6">
          {about.ab_photo_url ? (
            <img
              src={about.ab_photo_url || "/placeholder.svg"}
              alt={about.ab_name}
              className="w-full h-full object-cover rounded-full shadow-lg"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-cream-200 flex items-center justify-center">
              <span className="text-5xl">👩‍🍳</span>
            </div>
          )}
          {about.ab_accepts_orders && (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-full whitespace-nowrap">
              Aceitando pedidos
            </div>
          )}
        </div>

        {/* Name & Title */}
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-2">{about.ab_name}</h1>
        {about.ab_title && <p className="text-brown-600 font-medium text-lg">{about.ab_title}</p>}

        {/* Experience */}
        {about.ab_experience_years && (
          <p className="text-muted-foreground mt-2">
            <Clock className="w-4 h-4 inline mr-1" />
            {about.ab_experience_years} anos de experiência
          </p>
        )}
      </div>

      {/* Quote */}
      {about.ab_quote && (
        <blockquote className="glass-card rounded-2xl p-6 mb-8 text-center animate-slide-up">
          <p className="font-serif text-xl italic text-foreground">"{about.ab_quote}"</p>
        </blockquote>
      )}

      {/* Story */}
      {about.ab_story && (
        <section className="mb-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Minha História</h2>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{about.ab_story}</p>
        </section>
      )}

      {/* Specialty */}
      {about.ab_specialty && (
        <section className="mb-8 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Especialidades</h2>
          <p className="text-muted-foreground leading-relaxed">{about.ab_specialty}</p>
        </section>
      )}

      {/* Contact Info */}
      <section className="glass-card rounded-2xl p-6 animate-slide-up" style={{ animationDelay: "0.3s" }}>
        <h2 className="font-serif text-2xl font-bold text-foreground mb-6">Contato</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {about.ab_city && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <MapPin className="w-5 h-5 text-brown-600" />
              <span>{about.ab_city}</span>
            </div>
          )}

          {about.ab_whatsapp && (
            <a
              href={`https://wa.me/${about.ab_whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-muted-foreground hover:text-brown-600 transition-apple"
            >
              <Phone className="w-5 h-5 text-brown-600" />
              <span>{about.ab_whatsapp}</span>
            </a>
          )}

          {about.ab_email && (
            <a
              href={`mailto:${about.ab_email}`}
              className="flex items-center gap-3 text-muted-foreground hover:text-brown-600 transition-apple"
            >
              <Mail className="w-5 h-5 text-brown-600" />
              <span>{about.ab_email}</span>
            </a>
          )}

          {about.ab_instagram && (
            <a
              href={`https://instagram.com/${about.ab_instagram.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-muted-foreground hover:text-brown-600 transition-apple"
            >
              <Instagram className="w-5 h-5 text-brown-600" />
              <span>{about.ab_instagram}</span>
            </a>
          )}

          {about.ab_delivery_areas && (
            <div className="sm:col-span-2 flex items-start gap-3 text-muted-foreground pt-2 border-t border-border">
              <Truck className="w-5 h-5 text-brown-600 mt-0.5" />
              <div>
                <span className="font-medium text-foreground">Áreas de entrega:</span>
                <p className="mt-1">{about.ab_delivery_areas}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Admin floating button */}
      {user && (
        <FloatingEditButton
          isEditing={isEditing}
          onToggleEdit={() => {
            if (!isEditing) {
              setEditModalOpen(true)
            }
            setIsEditing(!isEditing)
          }}
        />
      )}

      {/* Edit Modal */}
      {editModalOpen && about && (
        <EditModal
          title="Editar Sobre"
          onClose={() => {
            setEditModalOpen(false)
            setIsEditing(false)
          }}
          onSave={handleSave}
          fields={[
            { key: "ab_name", label: "Nome", type: "text", value: about.ab_name },
            { key: "ab_photo_url", label: "URL da Foto", type: "text", value: about.ab_photo_url || "" },
            { key: "ab_title", label: "Título/Profissão", type: "text", value: about.ab_title || "" },
            { key: "ab_story", label: "Minha História", type: "textarea", value: about.ab_story || "" },
            { key: "ab_specialty", label: "Especialidades", type: "textarea", value: about.ab_specialty || "" },
            {
              key: "ab_experience_years",
              label: "Anos de Experiência",
              type: "number",
              value: about.ab_experience_years || 0,
            },
            { key: "ab_quote", label: "Citação/Frase", type: "text", value: about.ab_quote || "" },
            { key: "ab_instagram", label: "Instagram", type: "text", value: about.ab_instagram || "" },
            { key: "ab_whatsapp", label: "WhatsApp", type: "text", value: about.ab_whatsapp || "" },
            { key: "ab_email", label: "E-mail", type: "text", value: about.ab_email || "" },
            { key: "ab_city", label: "Cidade", type: "text", value: about.ab_city || "" },
            { key: "ab_delivery_areas", label: "Áreas de Entrega", type: "text", value: about.ab_delivery_areas || "" },
            {
              key: "ab_accepts_orders",
              label: "Aceitando Pedidos",
              type: "checkbox",
              value: about.ab_accepts_orders ?? true,
            },
          ]}
        />
      )}
    </main>
  )
}
