import clsx from "clsx"

type ButtonVariant = "primary" | "secondary" | "destructive" | "ghost" | "text"
type ButtonSize = "sm" | "md" | "lg"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  children: React.ReactNode
}

export default function Button({
  variant = "primary",
  size = "md",
  isLoading,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  const baseStyles = "font-medium rounded-xl transition active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 disabled:opacity-50 disabled:active:scale-100"

  const variantStyles = {
    primary:
      "bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 dark:hover:bg-blue-600",
    secondary:
      "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700",
    destructive: "bg-red-500 text-white hover:bg-red-600 active:bg-red-700 dark:hover:bg-red-600",
    ghost: "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20",
    text: "text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300",
  }

  const sizeStyles = {
    sm: "px-2 py-1 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  }

  return (
    <button
      disabled={disabled || isLoading}
      className={clsx(baseStyles, variantStyles[variant], sizeStyles[size], className)}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  )
}
