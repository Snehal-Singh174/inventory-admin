/* SCREEN PLAN: Login
 * Grid: N/A — split-panel layout (50/50), mobile: form-only full-width
 * Sections (in order): Brand Panel (left) | Form Panel (right)
 * States: loading (submit spinner) / error (banner) / empty (N/A) / success (redirect)
 * Copy: "Sign in to InvenTrack", "One source of truth for stock, cost, and change history.",
 *   Error: "Invalid credentials — use the demo accounts below to sign in",
 *   Error: "This account has been deactivated. Contact your administrator."
 * Slop risks: bare form on blank, generic copy, no demo table, missing show/hide toggle
 */
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/auth-context';
import { Eye, EyeOff, Package, ArrowRight, Loader2, BarChart3, Shield, History } from 'lucide-react';
import { cn } from '../utils/cn';

const DEMO_CREDENTIALS = [
  { role: 'Editor', email: 'editor@inventrack.dev', password: 'Editor123!' },
  { role: 'Viewer', email: 'viewer@inventrack.dev', password: 'Viewer123!' },
];

const FEATURE_HIGHLIGHTS = [
  {
    icon: Package,
    title: 'Complete inventory control',
    description: 'Track every SKU, quantity, and cost in one dense, filterable table.',
  },
  {
    icon: History,
    title: 'Full audit trail',
    description: 'Every change logged with who, what, and when — before/after diffs included.',
  },
  {
    icon: Shield,
    title: 'Role-based access',
    description: 'Viewers see data. Editors own it. Permissions enforced at every layer.',
  },
];

function DemoCredentialsTable({ onUse }) {
  return (
    <div className="mt-6 border border-border rounded-lg overflow-hidden">
      <div className="bg-accent/50 px-4 py-2.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Demo Accounts
        </p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Role</th>
            <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Email</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody>
          {DEMO_CREDENTIALS.map((cred) => (
            <tr key={`demo-${cred.role}`} className="border-b border-border last:border-b-0">
              <td className="px-4 py-2.5">
                <span className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                  cred.role === 'Editor'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-info/10 text-info'
                )}>
                  {cred.role}
                </span>
              </td>
              <td className="px-4 py-2.5 font-mono text-xs text-foreground">
                {cred.email}
              </td>
              <td className="px-4 py-2.5 text-right">
                <button
                  type="button"
                  onClick={() => onUse(cred)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/5 rounded transition-colors min-h-[28px]"
                >
                  Use
                  <ArrowRight size={12} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data) => {
    setErrorMessage('');
    const result = await login(data.email, data.password);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      if (result.status === 401) {
        setErrorMessage('Invalid credentials — use the demo accounts below to sign in');
      } else if (result.status === 403) {
        setErrorMessage('This account has been deactivated. Contact your administrator.');
      } else {
        setErrorMessage(result.error || 'Failed to sign in. Check your connection and try again.');
      }
    }
  };

  const handleUseDemoCredential = (cred) => {
    setValue('email', cred.email, { shouldValidate: true });
    setValue('password', cred.password, { shouldValidate: true });
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen flex">
      {/* Brand Panel — hidden on mobile */}
      <div className="hidden md:flex md:w-1/2 bg-primary relative flex-col justify-center px-12 lg:px-16">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
              <Package size={22} className="text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-primary-foreground tracking-tight">
              InvenTrack
            </span>
          </div>

          <h1 className="text-3xl lg:text-4xl font-bold text-primary-foreground leading-tight mb-4">
            One source of truth for stock, cost, and change history.
          </h1>

          <div className="mt-10 space-y-6">
            {FEATURE_HIGHLIGHTS.map((feature) => (
              <div key={`feat-${feature.title}`} className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-lg bg-primary-foreground/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <feature.icon size={18} className="text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary-foreground">
                    {feature.title}
                  </p>
                  <p className="text-sm text-primary-foreground/75 mt-0.5">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 right-20 w-64 h-64 rounded-full border-2 border-primary-foreground" />
          <div className="absolute bottom-32 left-16 w-40 h-40 rounded-full border-2 border-primary-foreground" />
        </div>
      </div>

      {/* Form Panel */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 md:hidden">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package size={18} className="text-primary" />
            </div>
            <span className="text-xl font-bold text-foreground tracking-tight">
              InvenTrack
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">
              Sign in to InvenTrack
            </h2>
            <p className="text-sm text-muted-foreground mt-1.5">
              Enter your credentials to access the inventory system.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div
              className="mb-6 p-3 rounded-lg bg-errorBackground border border-error/20 text-sm text-error flex items-start gap-2"
              role="alert"
            >
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 10.5a.75.75 0 110-1.5.75.75 0 010 1.5zM8.75 4.75a.75.75 0 00-1.5 0v3.5a.75.75 0 001.5 0v-3.5z" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Email field */}
            <div className="mb-4">
              <label htmlFor="login-email" className="block text-sm font-medium text-foreground mb-1.5">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                disabled={isLoading}
                className={cn(
                  'w-full h-11 px-3 rounded-lg border bg-surface text-foreground text-sm placeholder:text-muted-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  errors.email ? 'border-error' : 'border-border'
                )}
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Enter a valid email address',
                  },
                })}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-error">{errors.email.message}</p>
              )}
            </div>

            {/* Password field */}
            <div className="mb-4">
              <label htmlFor="login-password" className="block text-sm font-medium text-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  disabled={isLoading}
                  className={cn(
                    'w-full h-11 px-3 pr-10 rounded-lg border bg-surface text-foreground text-sm placeholder:text-muted-foreground',
                    'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    errors.password ? 'border-error' : 'border-border'
                  )}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters',
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-error">{errors.password.message}</p>
              )}
            </div>

            {/* Remember me */}
            <div className="flex items-center mb-6">
              <input
                id="remember-me"
                type="checkbox"
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="remember-me" className="ml-2 text-sm text-muted-foreground">
                Remember me
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'w-full h-11 rounded-lg bg-primary text-primary-foreground text-sm font-semibold',
                'hover:bg-primary/90 active:scale-[0.98] transition-all duration-150',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                'disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100',
                'flex items-center justify-center gap-2'
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Signing in…</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <DemoCredentialsTable onUse={handleUseDemoCredential} />
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
