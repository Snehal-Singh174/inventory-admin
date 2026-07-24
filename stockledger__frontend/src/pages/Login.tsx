/* SCREEN PLAN: Login
 * Layout: Full-viewport split — left 50% brand panel (bg-sidebar, dark navy),
 *         right 50% form panel (bg-surface, light). Mobile: hide left, form only.
 * Left panel: logo mark, "StockLedger" name, tagline, 3 feature highlights with icons
 * Right panel: "Sign in to StockLedger" title, email/password form,
 *              "Remember me" checkbox, "Sign in" CTA, demo credentials table, error banner
 * States:
 *   - Submitting: button shows spinner + "Signing in…", inputs disabled
 *   - Error: inline banner — "Invalid credentials — use the demo accounts below to sign in"
 *   - Success: navigate to /inventory
 * Slop risks:
 *   - Font must be Manrope (not Inter/Poppins) — enforced via CSS var + tailwind token
 *   - No raw hex in classNames — all named tokens
 *   - Demo credentials use real names from seed data (not "admin@example.com")
 *   - Submit label "Sign in" not generic "Submit"
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, BarChart3, Package, AlertTriangle, ArrowRight, Loader2, ScrollText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../utils/cn';

interface LoginFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface DemoAccount {
  role: string;
  label: string;
  email: string;
  password: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: 'EDITOR',
    label: 'Editor',
    email: 'marcus.editor@stockledger.io',
    password: 'EditStock#2026',
  },
  {
    role: 'VIEWER',
    label: 'Viewer',
    email: 'priya.viewer@stockledger.io',
    password: 'ViewStock#2026',
  },
];

const FEATURE_HIGHLIGHTS = [
  {
    id: 'fh-audit',
    Icon: ScrollText,
    title: 'Every edit traced to a person and a timestamp',
    body: 'Create, update, and delete actions are logged with before/after values — no silent changes.',
  },
  {
    id: 'fh-filter',
    Icon: ArrowRight,
    title: 'Filter, sort, and export your live stock count',
    body: 'Keyword search, category filter, quantity range, and one-click Excel export of any view.',
  },
  {
    id: 'fh-roles',
    Icon: Package,
    title: 'Role-based access — look, or edit, never both by accident',
    body: 'Viewers see the data. Editors change it. The boundary is enforced at every API call.',
  },
];

export function Login() {
  const { user, isLoading: authLoading, login } = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  // Redirect already-authenticated users
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/inventory', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const onSubmit = async (values: LoginFormValues) => {
    setApiError(null);
    try {
      await login(values.email, values.password, values.rememberMe);
      navigate('/inventory', { replace: true });
    } catch (err) {
      // Clear password on any auth failure — email is retained per spec
      setValue('password', '', { shouldValidate: false });
      const msg = err instanceof Error ? err.message.toLowerCase() : '';
      if (msg.includes('deactivated') || msg.includes('disabled')) {
        setApiError('This account has been deactivated. Contact your administrator.');
      } else if (
        msg.includes('network') ||
        msg.includes('timed out') ||
        msg.includes('could not reach') ||
        msg.includes('connection')
      ) {
        setApiError('Could not reach server. Try again.');
      } else {
        setApiError('Invalid credentials — use the demo accounts below to sign in');
      }
    }
  };

  const handleDemoFill = (account: DemoAccount) => {
    setValue('email', account.email, { shouldValidate: true });
    setValue('password', account.password, { shouldValidate: true });
    setApiError(null);
  };

  if (authLoading) return null; // ProtectedRoute handles skeleton; Login shows nothing while resolving

  return (
    <div className="min-h-screen flex bg-surface">
      {/* ── Left brand panel ───────────────────────────────────── */}
      <div
        className="hidden md:flex md:w-1/2 bg-sidebar flex-col px-12 py-14
                   relative overflow-hidden"
      >
        {/* Subtle texture overlay */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-100 login-brand-overlay"
        />

        <div className="relative z-10 flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-elevation-2">
              <BarChart3 size={20} color="white" strokeWidth={2.5} />
            </div>
            <span className="text-sidebarTextActive font-bold text-xl tracking-tight">
              StockLedger
            </span>
          </div>

          {/* Tagline */}
          <h2 className="text-3xl font-bold text-sidebarTextActive leading-snug max-w-xs mb-3">
            Know what you have. Prove who changed it.
          </h2>
          <p className="text-sidebarText text-base leading-relaxed mb-14 max-w-sm">
            A single relational source of truth for every SKU — gated, audited, and always current.
          </p>

          {/* Feature highlights */}
          <div className="flex flex-col gap-8">
            {FEATURE_HIGHLIGHTS.map(({ id, Icon, title, body }) => (
              <div key={id} className="flex gap-4">
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-sidebarActive flex items-center justify-center mt-0.5">
                  <Icon size={16} color="white" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-sidebarTextActive mb-0.5">{title}</p>
                  <p className="text-sm text-sidebarText leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <p className="mt-auto text-xs text-sidebarGroup">
            Internal inventory management platform · Restricted access
          </p>
        </div>
      </div>

      {/* ── Right form panel ───────────────────────────────────── */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-sm">
          {/* Mobile brand mark */}
          <div className="flex items-center gap-2 mb-8 md:hidden">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <BarChart3 size={15} color="white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-base text-onBackground">StockLedger</span>
          </div>

          <h1 className="text-2xl font-bold text-onBackground mb-1">
            Sign in to Inventory
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            Use your account credentials or a demo account below.
          </p>

          {/* Error banner */}
          {apiError && (
            <div
              role="alert"
              className="flex items-start gap-3 mb-6 px-4 py-3 bg-errorBackground
                         border border-error rounded-lg animate-fade-in"
            >
              <AlertTriangle
                size={16}
                strokeWidth={2}
                className="flex-shrink-0 mt-0.5 text-error"
                aria-hidden="true"
              />
              <p className="text-sm text-error font-medium">{apiError}</p>
            </div>
          )}

          {/* Sign-in form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            aria-label="Sign in form"
          >
            {/* Email */}
            <div className="mb-5">
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-onSurface mb-1.5"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                disabled={isSubmitting}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                className={cn(
                  'w-full h-11 px-3 rounded-lg border bg-surface text-sm text-onSurface',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'placeholder:text-muted-foreground',
                  errors.email
                    ? 'border-error'
                    : 'border-border hover:border-muted-foreground',
                )}
                placeholder="you@stockledger.io"
                {...register('email', {
                  required: 'Email address is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Enter a valid email address',
                  },
                })}
              />
              {errors.email && (
                <p id="email-error" role="alert" className="mt-1.5 text-xs text-error">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="mb-5">
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-onSurface mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  className={cn(
                    'w-full h-11 px-3 pr-11 rounded-lg border bg-surface text-sm text-onSurface',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'placeholder:text-muted-foreground',
                    errors.password
                      ? 'border-error'
                      : 'border-border hover:border-muted-foreground',
                  )}
                  placeholder="Your password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground
                             hover:text-onSurface transition-colors p-0.5"
                >
                  {showPassword ? (
                    <EyeOff size={16} strokeWidth={2} aria-hidden="true" />
                  ) : (
                    <Eye size={16} strokeWidth={2} aria-hidden="true" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" role="alert" className="mt-1.5 text-xs text-error">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2.5 mb-6">
              <input
                id="rememberMe"
                type="checkbox"
                disabled={isSubmitting}
                className="w-4 h-4 rounded border-border text-primary
                           focus:ring-primary focus:ring-offset-1 cursor-pointer"
                {...register('rememberMe')}
              />
              <label
                htmlFor="rememberMe"
                className="text-sm text-muted-foreground cursor-pointer select-none"
              >
                Keep me signed in for 8 hours
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className={cn(
                'w-full h-11 rounded-lg font-semibold text-sm text-onPrimary bg-primary',
                'flex items-center justify-center gap-2',
                'hover:bg-primary-500 active:scale-[0.98]',
                'transition-all duration-150',
                'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                'disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100',
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} strokeWidth={2} className="animate-spin" aria-hidden="true" />
                  <span>Signing in…</span>
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Try a demo account
            </p>
            <div
              className="rounded-lg border border-border overflow-hidden"
              role="region"
              aria-label="Demo account quick-fill"
            >
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted border-b border-border">
                    <th
                      scope="col"
                      className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground"
                    >
                      Role
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground"
                    >
                      Email
                    </th>
                    <th scope="col" className="sr-only">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {DEMO_ACCOUNTS.map((account, idx) => (
                    <tr
                      key={`demo-${account.role}`}
                      className={cn(
                        'group hover:bg-muted transition-colors',
                        idx < DEMO_ACCOUNTS.length - 1 && 'border-b border-border',
                      )}
                    >
                      <td className="px-3 py-2.5">
                        <span
                          className={cn(
                            'badge',
                            account.role === 'EDITOR' ? 'badge-editor' : 'badge-viewer',
                          )}
                        >
                          {account.label}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-xs font-mono text-muted-foreground">
                          {account.email}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleDemoFill(account)}
                          aria-label={`Use ${account.label} demo account`}
                          disabled={isSubmitting}
                          className="inline-flex items-center gap-1 text-xs font-semibold
                                     text-primary hover:text-primary-500 disabled:opacity-50
                                     transition-colors duration-150"
                        >
                          Use
                          <ArrowRight size={11} strokeWidth={2.5} aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Clicking "Use" pre-fills the form above. Password: <span className="font-mono">EditStock#2026</span> / <span className="font-mono">ViewStock#2026</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
