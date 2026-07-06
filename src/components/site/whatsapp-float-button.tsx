"use client"

import { motion } from "motion/react"
import { MessageCircle } from "lucide-react"

export function WhatsappFloatButton() {
  return (
    <motion.a
      href="https://wa.me/972503610061"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="דבר איתנו בוואטסאפ"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-ran-primary to-ran-accent text-white shadow-lg shadow-ran-accent/40 transition-transform hover:scale-105"
      animate={{ boxShadow: ["0 0 0 0 rgba(139,92,246,0.35)", "0 0 0 14px rgba(139,92,246,0)"] }}
      transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
    >
      <MessageCircle className="h-6 w-6" />
    </motion.a>
  )
}
