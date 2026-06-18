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
  const baseStyles = "font-medium rounded-lg transition active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 disabled:opacity-50 disabled:active:scale-100"

  const variantStyles = {
    primary:
      "bg-sky-500 text-white hover:bg-sky-600 active:bg-sky-700 dark:hover:bg-sky-600",
    secondary:
      "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600",
    destructive: "bg-red-500 text-white hover:bg-red-600 active:bg-red-700 dark:hover:bg-red-600",
    ghost: "text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20",
    text: "text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300",
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
