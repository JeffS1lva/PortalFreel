"use client"

import { useEffect } from "react"
import logo from "@/assets/logoBrowser.png"

interface FloatingLoadingProps {
  imageUrl?: string
  size?: number
}

export default function FloatingLoading({ size = 80 }: FloatingLoadingProps) {
  useEffect(() => {
    const style = document.createElement("style")
    style.textContent = `
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-20px); }
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .animate-float {
        animation: float 3s ease-in-out infinite;
      }
      
      .animate-spin-slow {
        animation: spin 2s linear infinite;
      }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="relative">
        {/* Spinner rotativo */}
        <div
          className="absolute inset-0 animate-spin-slow"
          style={{
            width: size + 70,
            height: size + 70,
            left: -26,
            top: -29,
          }}
        >
          <div className="w-full h-full rounded-full border-4 border-transparent border-t-[#001f60] border-r-[#001f60]"></div>


        </div>

        {/* Imagem flutuante */}
        <div className="animate-float relative z-10">
          <img src={logo || "/placeholder.svg"} alt="Loading" width={size} height={size} className="rounded-lg" />
        </div>
      </div>
    </div>
  )
}
