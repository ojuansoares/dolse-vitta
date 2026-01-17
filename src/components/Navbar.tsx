import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { ShoppingBag, Menu, X, User, LogOut } from "lucide-react"
import { useCart } from "@/contexts/CartContext"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function Navbar() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const { itemCount } = useCart()
  const { user, signOut } = useAuth()
  const location = useLocation()
  const pathname = location.pathname

  const handleLogout = () => {
    setShowLogoutConfirm(false)
    signOut()
  }

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    setIsExpanded(false)
  }, [pathname])

  const navLinks = [
    { href: "/", label: "Cardápio" },
    { href: "/sobre", label: "Sobre" },
  ]

  const adminLinks = [{ href: "/pedidos", label: "Pedidos" }]

  return (
    <>
      {/* Logout Confirmation Modal */}
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent className="bg-cream-50">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-brown-600 font-serif">Sair do modo admin?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Tem certeza que deseja sair? Você precisará fazer login novamente para acessar as funções administrativas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-brown-200 text-brown-600 hover:bg-brown-50">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out",
          isScrolled || isExpanded ? "glass border-b border-white/20" : "bg-transparent",
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              to="/"
              className="font-serif text-2xl font-bold text-brown-600 hover:text-brown-700 transition-all duration-300"
            >
              Dolce Vitta
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "text-sm font-medium transition-all duration-300",
                    pathname === link.href ? "text-brown-600" : "text-foreground/70 hover:text-brown-600",
                  )}
                >
                  {link.label}
                </Link>
              ))}
              {user &&
                adminLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={cn(
                      "text-sm font-medium transition-all duration-300",
                      pathname === link.href ? "text-brown-600" : "text-foreground/70 hover:text-brown-600",
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Cart button - only for non-logged users */}
              {!user && (
                <Link
                  to="/carrinho"
                  className="relative p-2 rounded-full hover:bg-brown-500/10 transition-all duration-300"
                >
                  <ShoppingBag className="w-5 h-5 text-brown-600" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-brown-600 text-white text-xs font-medium rounded-full flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Admin indicator + Logout (Desktop) */}
              {user && (
                <div className="hidden md:flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-brown-500/10 text-brown-600">
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">Admin</span>
                  </div>
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="px-3 py-1.5 rounded-full text-sm font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all duration-300"
                  >
                    Sair
                  </button>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="md:hidden p-2 rounded-full hover:bg-brown-500/10 transition-all duration-300"
              >
                {isExpanded ? <X className="w-5 h-5 text-brown-600" /> : <Menu className="w-5 h-5 text-brown-600" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav Expanded */}
        <div
          className={cn(
            "md:hidden overflow-hidden transition-all duration-300",
            isExpanded ? "max-h-64 pb-4" : "max-h-0",
          )}
        >
          <div className="px-4 pt-2 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "block px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300",
                  pathname === link.href ? "bg-brown-500/10 text-brown-600" : "text-foreground/70 hover:bg-brown-500/5",
                )}
              >
                {link.label}
              </Link>
            ))}
            {user &&
              adminLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "block px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300",
                    pathname === link.href
                      ? "bg-brown-500/10 text-brown-600"
                      : "text-foreground/70 hover:bg-brown-500/5",
                  )}
                >
                  {link.label}
                </Link>
              ))}
            {user && (
              <>
                <div className="mx-4 my-2 px-4 py-2 flex items-center justify-center gap-2 rounded-xl bg-amber-500/15 text-amber-700 border border-amber-500/20">
                  <User className="w-4 h-4" />
                  <span className="text-sm font-semibold">Modo Admin</span>
                </div>
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="mx-4 my-2 w-[calc(100%-2rem)] px-4 py-2.5 rounded-xl text-sm font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all duration-300"
                >
                  Sair
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Spacer */}
      <div className="h-16" />
    </>
  )
}
