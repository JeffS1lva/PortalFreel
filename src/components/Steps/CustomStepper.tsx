"use client"

import React, { useState, Children, type ReactNode, type ReactElement } from "react"
import { Check } from "lucide-react"

interface CustomStepperProps {
  children: ReactNode
  currentStep?: number
  onStepChange?: (step: number) => void
  orientation?: "horizontal" | "vertical"
  variant?: "default" | "circle" | "pills"
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
  variant: "default" | "circle" | "pills"
  allowClick: boolean
  onStepClick: (step: number) => void
  isMobile?: boolean
}

interface StepConnectorProps {
  isCompleted: boolean
  orientation: "horizontal" | "vertical"
  variant: "default" | "circle" | "pills"
  isMobile?: boolean
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}

export function CustomStepper({
  children,
  currentStep: controlledStep,
  onStepChange,
  orientation = "horizontal",
  variant = "default",
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

  const isHorizontal = orientation === "horizontal"
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768

  return (
    <div className={cn("w-full flex flex-col flex-1 min-h-0", className)}>
      {/* Step Indicators Container */}
      <div className="w-full ">
        <div
          className={cn(
            "w-full",
            isHorizontal 
              ? "flex items-center justify-between overflow-x-auto pb-2 scrollbar-hide" 
              : "flex flex-col items-start gap-6",
          )}
        >
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
                  isMobile={isMobile}
                />
                {showConnector && index < totalSteps - 1 && (
                  <StepConnector
                    isCompleted={currentStep > stepNumber}
                    orientation={orientation}
                    variant={variant}
                    isMobile={isMobile}
                  />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 min-h-0">
        <div
          key={currentStep}
          className="h-full flex flex-col min-h-0 animate-fadeIn"
          style={{
            animation: 'fadeIn 0.4s ease-out'
          }}
        >
          {stepsArray[currentStep - 1]}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}

export function CustomStep({ children, className }: StepProps) {
  return (
    <div className={cn("w-full h-full flex flex-col min-h-0", className)}>
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
  variant,
  allowClick,
  onStepClick,
  isMobile = false,
}: StepIndicatorProps) {
  const isCompleted = step < currentStep
  const isCurrent = step === currentStep
  const isUpcoming = step > currentStep

  const canClick = allowClick && (isCompleted || isCurrent)

  const getVariantStyles = () => {
    switch (variant) {
      case "circle":
        return {
          container: cn(
            "flex flex-col items-center gap-3 transition-all duration-300",
            isMobile && "gap-2 flex-shrink-0"
          ),
          indicator: cn(
            "relative w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center font-bold text-base transition-all duration-500",
            "backdrop-blur-sm",
            isCompleted && "bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 text-white shadow-xl shadow-emerald-500/40",
            isCurrent && "bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 text-white shadow-2xl shadow-indigo-500/50 scale-110 ring-4 ring-indigo-200/50",
            isUpcoming && "bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 border-2 border-slate-300",
            canClick && "cursor-pointer hover:scale-105 active:scale-95",
          ),
          label: cn(
            "text-sm font-semibold text-center transition-colors duration-300",
            isMobile ? "max-w-[80px] text-xs" : "max-w-[110px]"
          ),
        }

      case "pills":
        return {
          container: cn("flex items-center gap-3 flex-shrink-0", isMobile && "gap-2"),
          indicator: cn(
            "px-4 py-2.5 md:px-5 md:py-3 rounded-full flex items-center gap-2.5 font-semibold text-sm transition-all duration-500 backdrop-blur-sm",
            isMobile && "px-3 py-2 text-xs gap-1.5",
            isCompleted && "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30",
            isCurrent && "bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white shadow-xl shadow-indigo-500/40 scale-105",
            isUpcoming && "bg-gradient-to-r from-slate-100 to-slate-200 text-slate-500 border border-slate-300",
            canClick && "cursor-pointer hover:shadow-2xl hover:scale-105 active:scale-95",
          ),
          label: cn("text-sm font-semibold", isMobile && "text-xs"),
        }

      default:
        return {
          container: cn(
            "flex flex-col items-center gap-3 flex-1 transition-all duration-300",
            isMobile ? "gap-2 flex-1 flex-shrink" : "gap-3 flex-1",
          ),
          indicator: cn(
            "relative w-11 h-11 md:w-14 md:h-14 rounded-xl flex items-center justify-center font-bold text-base transition-all duration-500 backdrop-blur-sm",
            "before:absolute before:inset-0 before:rounded-xl before:transition-all before:duration-500",
            isCompleted && [
              "bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-500/30",
              "before:bg-gradient-to-br before:from-emerald-400 before:to-emerald-600 before:opacity-0 hover:before:opacity-100"
            ],
            isCurrent && [
              "bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 text-white shadow-xl shadow-indigo-500/40 scale-110",
              "ring-4 ring-indigo-200/60",
              "before:bg-gradient-to-br before:from-indigo-500 before:to-purple-600"
            ],
            isUpcoming && "bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 border-2 border-slate-300",
            canClick && "cursor-pointer hover:scale-105 active:scale-95",
          ),
          label: cn(
            "text-center font-semibold transition-colors duration-300",
            isMobile ? "text-xs mt-1 max-w-[70px]" : "text-sm max-w-[100px]"
          ),
        }
    }
  }

  const styles = getVariantStyles()

  return (
    <div
      className={cn(styles.container, isMobile && "min-w-max")}
      onClick={() => canClick && onStepClick(step)}
      style={{
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <div className={styles.indicator}>
        <div className="relative z-10 flex items-center justify-center">
          {isCompleted ? (
            <div className="animate-scaleIn">
              <Check className={cn("w-5 h-5 md:w-6 md:h-6 stroke-[3]", isMobile && "w-4 h-4")} />
            </div>
          ) : icon ? (
            React.cloneElement(icon as ReactElement, {
              className: cn((icon as ReactElement).props.className, "w-5 h-5 md:w-6 md:h-6", isMobile && "h-4 w-4"),
            })
          ) : (
            <span className="font-bold">{step}</span>
          )}
        </div>
        {variant === "pills" && label && <span className="relative z-10">{label}</span>}
      </div>

      {variant !== "pills" && label && (
        <div className="flex flex-col items-center gap-1">
          <span
            className={cn(
              styles.label,
              isCurrent && "text-indigo-700 font-bold",
              isCompleted && "text-emerald-700",
              isUpcoming && "text-slate-500",
            )}
          >
            {label}
          </span>
          {description && !isMobile && (
            <span className="text-xs text-slate-500 text-center max-w-[130px] leading-tight">
              {description}
            </span>
          )}
        </div>
      )}

      <style>{`
        @keyframes scaleIn {
          from {
            transform: scale(0) rotate(-180deg);
            opacity: 0;
          }
          to {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
        .animate-scaleIn {
          animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  )
}

function StepConnector({ isCompleted, orientation, variant, isMobile = false }: StepConnectorProps) {
  const isHorizontal = orientation === "horizontal"

  const getConnectorStyles = () => {
    if (variant === "pills") {
      return isHorizontal
        ? cn("h-1 w-3 md:w-10 mx-1.5 md:mx-3 rounded-full", isMobile && "w-3 mx-1.5")
        : cn("w-1 h-8 md:h-10 my-2 ml-6 md:ml-7 rounded-full", isMobile && "h-6 my-1.5 ml-5")
    }

    return isHorizontal
      ? cn("h-1 flex-1 mx-1.5 md:mx-3 rounded-full", isMobile && "mx-1.5")
      : cn("w-1 h-14 ml-5 md:ml-6.5 rounded-full", isMobile && "h-10 ml-5")
  }

  return (
    <div className={cn("relative overflow-hidden flex-shrink-0", getConnectorStyles())}>
      <div className="absolute inset-0 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full" />
      <div
        className={cn(
          "absolute inset-0 rounded-full transition-all duration-700 ease-out",
          isCompleted 
            ? "bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 shadow-lg shadow-emerald-500/20" 
            : "bg-slate-300",
        )}
        style={{
          width: isCompleted && isHorizontal ? "100%" : isCompleted ? "100%" : "0%",
          height: isCompleted && !isHorizontal ? "100%" : isCompleted ? "100%" : "0%",
        }}
      />
    </div>
  )
}

// Demo Component
export default function App() {
  const [currentStep, setCurrentStep] = useState(1)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <CustomStepper
          currentStep={currentStep}
          onStepChange={setCurrentStep}
          variant="default"
          orientation="horizontal"
        >
          <CustomStep label="Informações" description="Dados básicos">
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-slate-200">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
                Passo 1: Informações Iniciais
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Configure os dados básicos da sua cotação
              </p>
            </div>
          </CustomStep>

          <CustomStep label="Produtos" description="Selecione itens">
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-slate-200">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
                Passo 2: Adicionar Produtos
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Escolha os produtos para a cotação
              </p>
            </div>
          </CustomStep>

          <CustomStep label="Revisão" description="Confirme os dados">
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-slate-200">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
                Passo 3: Revisar e Finalizar
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Revise todas as informações antes de finalizar
              </p>
            </div>
          </CustomStep>
        </CustomStepper>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="px-6 py-3 bg-slate-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Anterior
          </button>
          <button
            onClick={() => setCurrentStep(Math.min(3, currentStep + 1))}
            disabled={currentStep === 3}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Próximo
          </button>
        </div>
      </div>
    </div>
  )
}