"use client";

import React, { useActionState } from "react";
import { Store, User, Lock, ArrowRight, Github, AlertCircle } from "lucide-react";
import Link from "next/link";
import { authenticate } from "@/lib/actions/auth";

export default function LoginPage() {
  const [errorMessage, dispatch, isPending] = useActionState(
    authenticate,
    undefined,
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-orange-100/50 via-slate-50 to-slate-50">

      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-200/40 blur-3xl rounded-full"></div>
        <div className="absolute top-40 -left-40 w-72 h-72 bg-blue-200/40 blur-3xl rounded-full"></div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md w-full px-4">

        {/* Logo and Header */}
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-10">
          <div className="mx-auto h-16 w-16 bg-white rounded-2xl shadow-sm border border-orange-100 flex items-center justify-center transform rotate-3 hover:rotate-6 transition-transform duration-300">
            <Store className="h-8 w-8 text-orange-500" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
            ยินดีต้อนรับกลับมา
          </h2>
          <p className="mt-2 text-center text-sm text-slate-500">
            ระบบจัดการร้านอาหาร POS System
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white py-10 px-6 sm:px-10 shadow-xl shadow-orange-500/5 rounded-3xl border border-slate-100/60 backdrop-blur-xl relative overflow-hidden group">

          {/* subtle top highlight */}
          <div className="absolute top-0 inset-x-0 h-1 bg-linear-to-r from-orange-400 to-orange-500 opacity-80"></div>

          <form className="space-y-6" action={dispatch}>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="username">
                ชื่อผู้ใช้งาน
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-4.5 w-4.5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  placeholder="admin"
                  className="appearance-none block w-full pl-10 px-4 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 sm:text-sm transition-all duration-200 bg-slate-50/50 hover:bg-white focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="password">
                รหัสผ่าน
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4.5 w-4.5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="appearance-none block w-full pl-10 px-4 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 sm:text-sm transition-all duration-200 bg-slate-50/50 hover:bg-white focus:bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-slate-300 rounded cursor-pointer accent-orange-500"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600 cursor-pointer select-none">
                  จดจำฉันในระบบ
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-semibold text-orange-600 hover:text-orange-500 transition-colors">
                  ลืมรหัสผ่าน?
                </a>
              </div>
            </div>

            {errorMessage && (
              <div
                className="flex h-8 items-center space-x-1"
                aria-live="polite"
                aria-atomic="true"
              >
                <AlertCircle className="h-5 w-5 text-red-500" />
                <p className="text-sm text-red-500">{errorMessage}</p>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-300 active:scale-[0.98] hover:shadow-lg hover:shadow-orange-500/25 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isPending ? "กำลังเข้าสู่ระบบ..." : (
                  <>เข้าสู่ระบบ <ArrowRight className="w-4 h-4 ml-1" /></>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-slate-500">ติดต่อผู้ดูแลระบบ</span>
              </div>
            </div>

            <div className="mt-6 flex gap-3 text-center sm:text-left justify-center text-sm text-slate-500">
              หากพบปัญหาการเข้าใช้งาน กรุณาติดต่อ ฝ่ายไอที
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-slate-400">
          &copy; {new Date().getFullYear()} POS System. All rights reserved.
        </p>

      </div>
    </div>
  );
}
