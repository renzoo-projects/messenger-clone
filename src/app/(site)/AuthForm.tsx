"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import toast from "react-hot-toast"
import { api } from "@/lib/axios"

type FormData = {
  name: string
  email: string
  password: string
}

export default function AuthForm() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>()

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)

    try {
      if (isLogin) {
        const result = await signIn("credentials", {
          email: data.email,
          password: data.password,
          redirect: false,
        })

        if (result?.error) {
          toast.error(result.error || "Invalid credentials")
          return
        }

        router.push("/conversations")
        router.refresh()
      } else {
        await api.post("/api/register", data)
        toast.success("Account created!")
        const result = await signIn("credentials", {
          email: data.email,
          password: data.password,
          redirect: false,
        })
        if (result?.ok) {
          router.push("/conversations")
          router.refresh()
        }
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  const socialLogin = async (provider: string) => {
    setIsLoading(true)
    try {
      await signIn(provider, { callbackUrl: "/conversations" })
    } catch {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          {isLogin ? "Sign in to your account" : "Create a new account"}
        </h2>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 px-4 py-8 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {!isLogin && (
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Name
                </label>
                <input
                  id="name"
                  disabled={isLoading}
                  {...register("name", { required: !isLogin })}
                  autoFocus={!isLogin}
                  aria-describedby={errors.name ? "name-error" : undefined}
                  className="mt-1 block w-full rounded-xl border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                />
                {errors.name && (
                  <p id="name-error" className="text-xs text-red-500 mt-1">Name is required</p>
                )}
              </div>
            )}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Email
              </label>
                <input
                  id="email"
                  type="email"
                  disabled={isLoading}
                  {...register("email", { required: true })}
                  autoFocus={isLogin}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className="mt-1 block w-full rounded-xl border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                />
                {errors.email && (
                  <p id="email-error" className="text-xs text-red-500 mt-1">Email is required</p>
                )}
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Password
              </label>
                <input
                  id="password"
                  type="password"
                  disabled={isLoading}
                  {...register("password", { required: true, minLength: 6 })}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  className="mt-1 block w-full rounded-xl border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                />
                <div id="password-error">
                  {errors.password?.type === "required" && (
                    <p className="text-xs text-red-500 mt-1">Password is required</p>
                  )}
                  {errors.password?.type === "minLength" && (
                    <p className="text-xs text-red-500 mt-1">Password must be at least 6 characters</p>
                  )}
                </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full justify-center rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 active:bg-blue-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 active:scale-[0.97] disabled:active:scale-100"
            >
              {isLogin ? "Sign in" : "Register"}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => socialLogin("google")}
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 active:scale-[0.97]"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-medium text-blue-600 hover:text-blue-500 active:text-blue-700 transition-colors duration-150"
            >
              {isLogin ? "Create one" : "Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
