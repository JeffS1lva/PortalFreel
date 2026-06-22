"use client"

import React, { useState, Children, type ReactNode, type ReactElement } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check } from "lucide-react"

interface CustomStepperProps {
  children: ReactNode
  currentStep?: number
  onStepChange?: (step: number) => void
  orientation?: "horizontal" | "vertical"
  variant?: "default" | "circle" | "pills" | "modern"
  showConnector?: boolean
  allowClickNavigation?: boolean
  className?: string
}

interface StepProps {
  children: ReactNode
  label?: string
  description?: string
  icon?: ReactNode
  className?: string
}

interface StepIndicatorProps {
  step: number
  currentStep: number
  totalSteps: number
  label?: string
  description?: string
  icon?: ReactNode
  variant: "default" | "circle" | "pills" | "modern"
  allowClick: boolean
  onStepClick: (step: number) => void
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}

export function CustomStepper({
  children,
  currentStep: controlledStep,
  onStepChange,
  variant = "modern",
  showConnector = true,
  allowClickNavigation = true,
  className,
}: CustomStepperProps) {
  const [internalStep, setInternalStep] = useState(1)
  const currentStep = controlledStep ?? internalStep

  const stepsArray = Children.toArray(children)
  const totalSteps = stepsArray.length

  const handleStepChange = (newStep: number) => {
    if (!allowClickNavigation) return

    if (newStep <= currentStep && newStep >= 1 && newStep <= totalSteps) {
      if (controlledStep === undefined) {
        setInternalStep(newStep)
      }
      onStepChange?.(newStep)
    }
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Step Indicators - Modern Layout */}
      <div className="relative">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {stepsArray.map((child, index) => {
            if (!React.isValidElement(child)) return null
            const stepChild = child as ReactElement<StepProps>
            const { label, description, icon } = stepChild.props
            const stepNumber = index + 1

            return (
              <React.Fragment key={stepNumber}>
                <StepIndicator
                  step={stepNumber}
                  currentStep={currentStep}
                  totalSteps={totalSteps}
                  label={label}
                  description={description}
                  icon={icon}
                  variant={variant}
                  allowClick={allowClickNavigation}
                  onStepClick={handleStepChange}
                />
                {showConnector && index < totalSteps - 1 && (
                  <StepConnector
                    isCompleted={currentStep > stepNumber}
                    isActive={currentStep === stepNumber}
                    currentStep={currentStep}
                    stepNumber={stepNumber}
                    totalSteps={totalSteps}
                  />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function CustomStep({ children, className }: StepProps) {
  return (
    <div className={cn("w-full h-full", className)}>
      {children}
    </div>
  )
}

function StepIndicator({
  step,
  currentStep,
  label,
  description,
  icon,
  allowClick,
  onStepClick,
}: StepIndicatorProps) {
  const isCompleted = step < currentStep
  const isCurrent = step === currentStep
  const isUpcoming = step > currentStep

  const canClick = allowClick && (isCompleted || isCurrent)

  return (
    <motion.div
      className={cn(
        "relative flex flex-col items-center gap-3 group",
        canClick && "cursor-pointer"
      )}
      onClick={() => canClick && onStepClick(step)}
      whileHover={canClick ? { scale: 1.02 } : {}}
      whileTap={canClick ? { scale: 0.98 } : {}}
    >
      {/* Círculo Principal */}
      <div className="relative">
        {/* Anel externo animado para step atual */}
        {isCurrent && (
          <motion.div
            className="absolute -inset-2 rounded-full bg-indigo-500/20"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        
        {/* Círculo base */}
        <motion.div
          className={cn(
            "relative w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg transition-all duration-500 shadow-lg",
            isCompleted && "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-emerald-500/30",
            isCurrent && "bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-indigo-500/40 ring-4 ring-indigo-100",
            isUpcoming && "bg-white text-slate-400 border-2 border-slate-200 shadow-slate-200/50"
          )}
          animate={isCurrent ? { scale: 1.05 } : { scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <AnimatePresence mode="wait">
            {isCompleted ? (
              <motion.div
                key="check"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <Check className="w-6 h-6 stroke-[3]" />
              </motion.div>
            ) : icon ? (
              <motion.div
                key="icon"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                {React.cloneElement(icon as ReactElement, {
                  className: cn(
                    (icon as ReactElement).props.className,
                    "w-6 h-6",
                    isUpcoming && "text-slate-400"
                  ),
                })}
              </motion.div>
            ) : (
              <span>{step}</span>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Badge de número para steps futuros */}
        {isUpcoming && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-500 border border-slate-200">
            {step}
          </div>
        )}
      </div>

      {/* Labels */}
      <div className="flex flex-col items-center gap-1 text-center">
        <span
          className={cn(
            "text-sm font-bold transition-colors duration-300",
            isCurrent && "text-indigo-700",
            isCompleted && "text-emerald-700",
            isUpcoming && "text-slate-400"
          )}
        >
          {label}
        </span>
        {description && (
          <span className="text-xs text-slate-500 font-medium max-w-[120px] leading-tight">
            {description}
          </span>
        )}
      </div>
    </motion.div>
  )
}

function StepConnector({ 
  isCompleted, 
  currentStep, 
  stepNumber}: { 
  isCompleted: boolean
  isActive: boolean
  currentStep: number
  stepNumber: number
  totalSteps: number
}) {
  const progress = currentStep > stepNumber ? 100 : 0
  
  return (
    <div className="flex-1 h-1 mx-4 relative">
      {/* Linha de fundo */}
      <div className="absolute inset-0 bg-slate-200 rounded-full" />
      
      {/* Linha de progresso animada */}
      <motion.div
        className={cn(
          "absolute inset-y-0 left-0 rounded-full",
          isCompleted 
            ? "bg-gradient-to-r from-emerald-500 to-emerald-600" 
            : "bg-gradient-to-r from-indigo-500 to-purple-600"
        )}
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      />
      
      {/* Pontos de progresso intermediários */}
      <div className="absolute inset-0 flex justify-between items-center px-2">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className={cn(
              "w-1.5 h-1.5 rounded-full transition-colors duration-300",
              progress > (i + 1) * 25 
                ? "bg-white/50" 
                : "bg-slate-300"
            )}
          />
        ))}
      </div>
    </div>
  )
}

// Demo Component
export default function App() {
  const [currentStep, setCurrentStep] = useState(1)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <CustomStepper
          currentStep={currentStep}
          onStepChange={setCurrentStep}
          variant="modern"
          orientation="horizontal"
        >
          <CustomStep label="Cliente" description="Selecione o cliente">
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
              <h2 className="text-2xl font-bold text-slate-800 mb-4">
                Buscar Cliente
              </h2>
              <p className="text-slate-600">
                Digite o nome ou código do cliente para iniciar a cotação.
              </p>
            </div>
          </CustomStep>

          <CustomStep label="Informações" description="Dados da proposta">
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
              <h2 className="text-2xl font-bold text-slate-800 mb-4">
                Informações Gerais
              </h2>
              <p className="text-slate-600">
                Preencha as informações básicas da cotação.
              </p>
            </div>
          </CustomStep>

          <CustomStep label="Itens" description="Produtos e valores">
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
              <h2 className="text-2xl font-bold text-slate-800 mb-4">
                Adicionar Itens
              </h2>
              <p className="text-slate-600">
                Selecione os produtos e configure os preços.
              </p>
            </div>
          </CustomStep>

          <CustomStep label="Revisão" description="Confirme e finalize">
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
              <h2 className="text-2xl font-bold text-slate-800 mb-4">
                Revisar Cotação
              </h2>
              <p className="text-slate-600">
                Verifique todos os dados antes de enviar.
              </p>
            </div>
          </CustomStep>
        </CustomStepper>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="px-8 py-3 bg-white text-slate-700 rounded-full font-semibold shadow-lg shadow-slate-200/50 border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
          >
            Anterior
          </button>
          <button
            onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
            disabled={currentStep === 4}
            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-semibold shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl hover:shadow-indigo-500/40 transition-all"
          >
            Próximo
          </button>
        </div>
      </div>
    </div>
  )
}