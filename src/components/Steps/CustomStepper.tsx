"use client"

import React, { useState, Children, type ReactNode, type ReactElement } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

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
      {/* Step Indicators */}
      <div
        className={cn(
          "w-full",
          isHorizontal ? "flex items-center justify-between overflow-x-auto pb-2" : "flex flex-col items-start gap-4",
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

      {/* Step Content - CORRIGIDO */}
      <div className="flex-1 min-h-0 mt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full flex flex-col min-h-0"
          >
            {stepsArray[currentStep - 1]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export function CustomStep({ children, className }: StepProps) {
  return (
    <div className={cn("w-full h-full flex flex-col min-h-0 ", className)}>
      {children}
    </div>
  )
}

// StepIndicator e StepConnector (inalterados)
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
          container: cn("flex flex-col items-center gap-2", isMobile && "gap-1 flex-shrink-0"),
          indicator: cn(
            "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-semibold text-sm md:text-sm transition-all duration-300",
            isCompleted && "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30",
            isCurrent &&
              "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/40 scale-110",
            isUpcoming && "bg-gray-100 text-gray-400 border-2 border-gray-200",
            canClick && "cursor-pointer hover:scale-105",
          ),
          label: cn("text-sm font-medium text-center", isMobile ? "max-w-[70px] text-xs" : "max-w-[100px]"),
        }

      case "pills":
        return {
          container: cn("flex items-center gap-3 flex-shrink-0", isMobile && "gap-2"),
          indicator: cn(
            "px-3 py-2 md:px-4 md:py-2 rounded-full flex items-center gap-2 font-medium text-sm md:text-sm transition-all duration-300",
            isMobile && "px-2 py-1 text-xs gap-1",
            isCompleted && "bg-green-500 text-white shadow-md",
            isCurrent && "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30",
            isUpcoming && "bg-gray-100 text-gray-500",
            canClick && "cursor-pointer hover:shadow-xl",
          ),
          label: cn("text-sm font-medium", isMobile && "text-xs"),
        }

      default:
        return {
          container: cn(
            "flex flex-col items-center gap-2 flex-1",
            isMobile ? "gap-1 flex-1 flex-shrink" : "gap-2 flex-1",
          ),
          indicator: cn(
            "w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center font-bold text-sm md:text-sm transition-all duration-300 border-2",
            isCompleted && "bg-green-500 border-green-500 text-white shadow-md",
            isCurrent && "bg-indigo-600 border-indigo-600 text-white shadow-lg ring-4 ring-indigo-200",
            isUpcoming && "bg-white border-gray-300 text-gray-400",
            canClick && "cursor-pointer hover:scale-105",
          ),
          label: cn("text-center ", isMobile ? "text-xs mt-1 max-w-[60px] " : "text-xs font-semibold "),
        }
    }
  }

  const styles = getVariantStyles()

  return (
    <motion.div
      className={cn(styles.container, isMobile && "min-w-max")}
      onClick={() => canClick && onStepClick(step)}
      whileHover={canClick ? { scale: 1.02 } : {}}
      whileTap={canClick ? { scale: 0.98 } : {}}
    >
      <div className={styles.indicator}>
        {isCompleted ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            <Check className={cn("w-4 h-4 md:w-5 md:h-5", isMobile && "w-4 h-4")} />
          </motion.div>
        ) : icon ? (
          React.cloneElement(icon as ReactElement, {
            className: cn((icon as ReactElement).props.className, isMobile && "h-4 w-4"),
          })
        ) : (
          <span>{step}</span>
        )}
        {variant === "pills" && label && <span>{label}</span>}
      </div>

      {variant !== "pills" && label && (
        <div className="flex flex-col items-center gap-1">
          <span
            className={cn(
              styles.label,
              isCurrent && "text-indigo-600 font-bold",
              isCompleted && "text-green-600",
              isUpcoming && "text-gray-400",
            )}
          >
            {label}
          </span>
          {description && !isMobile && (
            <span className="text-xs text-gray-500 text-center max-w-[120px]">{description}</span>
          )}
        </div>
      )}
    </motion.div>
  )
}

function StepConnector({ isCompleted, orientation, variant, isMobile = false }: StepConnectorProps) {
  const isHorizontal = orientation === "horizontal"

  const getConnectorStyles = () => {
    if (variant === "pills") {
      return isHorizontal
        ? cn("h-0.5 w-2 md:w-8 mx-1 md:mx-2", isMobile && "w-2 mx-1")
        : cn("w-0.5 h-6 md:h-8 my-2 ml-5 md:ml-6", isMobile && "h-4 my-1 ml-4")
    }

    return isHorizontal
      ? cn("h-0.5 flex-1 mx-1 md:mx-2", isMobile && "mx-1")
      : cn("w-0.5 h-12 ml-4 md:ml-5", isMobile && "h-8 ml-4")
  }

  return (
    <div className={cn("relative overflow-hidden flex-shrink-0", getConnectorStyles())}>
      <div className="absolute inset-0 bg-gray-200" />
      <motion.div
        className={cn(
          "absolute inset-0",
          isCompleted ? "bg-gradient-to-r from-green-500 to-emerald-600" : "bg-gray-200",
        )}
        initial={{ width: 0, height: 0 }}
        animate={
          isCompleted
            ? isHorizontal
              ? { width: "100%", height: "100%" }
              : { height: "100%", width: "100%" }
            : { width: 0, height: 0 }
        }
        transition={{ duration: 0.5, ease: "easeInOut" }}
      />
    </div>
  )
}