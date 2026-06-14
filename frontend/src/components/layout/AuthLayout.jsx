import React from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

const features = [
  { icon: "💰", text: "Split bills in seconds" },
  { icon: "📊", text: "Real-time balance tracking" },
  { icon: "🤝", text: "Easy group settlements" },
];

export function AuthLayout({ title, subtitle, children, heroTitle, heroSubtitle, showDemo = false }) {
  return (
    <main className="auth-page">
      <div className="auth-bg" aria-hidden="true">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />
        <div className="auth-grid" />
      </div>

      <div className="relative z-10 flex min-h-screen">
        <div className="hidden lg:flex lg:w-[48%] xl:w-1/2 auth-panel">
          <div className="relative flex w-full flex-col justify-between p-12 xl:p-16">
            <Link to="/" className="auth-brand group">
              <div className="auth-brand-icon">S</div>
              <div>
                <p className="text-xl font-black text-white">SplitWise</p>
                <p className="text-sm text-white/50">Smart expense sharing</p>
              </div>
            </Link>

            <div className="max-w-lg">
              <p className="auth-badge">
                <Sparkles className="h-3.5 w-3.5" />
                Premium expense management
              </p>
              <h1 className="mt-6 text-4xl font-black leading-tight text-white xl:text-5xl auth-headline">
                {heroTitle}
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-white/65">{heroSubtitle}</p>

              <ul className="mt-10 space-y-4">
                {features.map(({ icon, text }) => (
                  <li key={text} className="auth-feature-item">
                    <span className="auth-feature-icon">{icon}</span>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {showDemo && (
              <div className="auth-demo-card">
                <Sparkles className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-white">Demo account</p>
                  <p className="text-xs text-white/50 mt-0.5">aisha@example.com · password123</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="auth-form-shell w-full max-w-[440px] animate-slide-up">
            <div className="auth-form-header">
              <div className="auth-form-icon">
                <span className="text-lg font-black text-primary">S</span>
              </div>
              <h2 className="auth-form-title">{title}</h2>
              <p className="auth-form-subtitle">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
