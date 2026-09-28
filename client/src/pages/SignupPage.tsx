import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { authService } from '../services/auth.service';
import {
  Building2,
  Mail,
  Lock,
  User,
  Phone,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    companyName: '',
    panNumber: '',
    password: '',
    confirmPassword: '',
    termsAgreed: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!formData.fullName.trim()) errs.fullName = 'Authorized Person Full Name is required';
    if (!formData.companyName.trim()) errs.companyName = 'Enterprise or Business Name is required';

    if (!formData.email.trim()) {
      errs.email = 'Official Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Please provide a valid email format';
    }

    if (!formData.phone.trim()) {
      errs.phone = 'Mobile Number is required for OTP/SMS alerts';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, '').slice(-10))) {
      errs.phone = 'Please provide a valid 10-digit mobile number';
    }

    if (!formData.panNumber.trim()) {
      errs.panNumber = 'Enterprise / Director PAN is required';
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(formData.panNumber)) {
      errs.panNumber = 'Valid 10-character PAN format required (e.g. ABCDE1234F)';
    }

    if (!formData.password) {
      errs.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    if (!formData.termsAgreed) {
      errs.termsAgreed = 'You must accept statutory terms and declaration';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await authService.signup({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        companyName: formData.companyName,
        panNumber: formData.panNumber.toUpperCase(),
        password: formData.password,
      });

      setSuccessMessage('Industrial registration completed successfully!');

      // Exactly per statutory flow: Welcome -> Signup -> Login
      setTimeout(() => {
        navigate('/login', {
          state: {
            registeredEmail: formData.email,
            message: 'Registration successful! Please login with your password to access your Citizen Dashboard.',
          },
        });
      }, 1400);
    } catch (err: any) {
      setErrors({ form: err.message || 'Registration failed. Please check details.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 border-b border-blue-900/50">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Step 1: Industrial Registration</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">Create Citizen Industrial Account</h1>
            <p className="text-xs text-blue-200 mt-1">
              Required for submitting and managing statutory applications under Maharashtra single-window portal.
            </p>
          </div>

          {/* Form */}
          <div className="p-6 sm:p-8">
            {successMessage && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-xs font-semibold animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold text-emerald-900">{successMessage}</div>
                  <div>Redirecting you to Login page (Step 2)...</div>
                </div>
              </div>
            )}

            {errors.form && (
              <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errors.form}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name & Enterprise */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1" htmlFor="fullName">
                    Authorized Person Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      id="fullName"
                      type="text"
                      placeholder="e.g. Authorized Signatory"
                      value={formData.fullName}
                      onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                      className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border bg-gray-50 focus:bg-white focus:outline-none transition ${
                        errors.fullName ? 'border-rose-400 ring-1 ring-rose-300' : 'border-gray-300 focus:border-blue-600'
                      }`}
                    />
                  </div>
                  {errors.fullName && <p className="text-[11px] text-rose-600 mt-1">{errors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1" htmlFor="companyName">
                    Enterprise / Company Name *
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      id="companyName"
                      type="text"
                      placeholder="e.g. Maharashtra Precision Pvt Ltd"
                      value={formData.companyName}
                      onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                      className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border bg-gray-50 focus:bg-white focus:outline-none transition ${
                        errors.companyName ? 'border-rose-400 ring-1 ring-rose-300' : 'border-gray-300 focus:border-blue-600'
                      }`}
                    />
                  </div>
                  {errors.companyName && <p className="text-[11px] text-rose-600 mt-1">{errors.companyName}</p>}
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1" htmlFor="email">
                    Official Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      id="email"
                      type="email"
                      placeholder="name@enterprise.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border bg-gray-50 focus:bg-white focus:outline-none transition ${
                        errors.email ? 'border-rose-400 ring-1 ring-rose-300' : 'border-gray-300 focus:border-blue-600'
                      }`}
                    />
                  </div>
                  {errors.email && <p className="text-[11px] text-rose-600 mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1" htmlFor="phone">
                    Mobile Number (for SMS & OTP) *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      id="phone"
                      type="tel"
                      placeholder="9823045678"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border bg-gray-50 focus:bg-white focus:outline-none transition ${
                        errors.phone ? 'border-rose-400 ring-1 ring-rose-300' : 'border-gray-300 focus:border-blue-600'
                      }`}
                    />
                  </div>
                  {errors.phone && <p className="text-[11px] text-rose-600 mt-1">{errors.phone}</p>}
                </div>
              </div>

              {/* PAN Number */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1" htmlFor="panNumber">
                  Entity / Director Permanent Account Number (PAN) *
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    id="panNumber"
                    type="text"
                    maxLength={10}
                    placeholder="e.g. AAFCO8492L"
                    value={formData.panNumber}
                    onChange={e => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border uppercase bg-gray-50 focus:bg-white focus:outline-none transition ${
                      errors.panNumber ? 'border-rose-400 ring-1 ring-rose-300' : 'border-gray-300 focus:border-blue-600'
                    }`}
                  />
                </div>
                {errors.panNumber && <p className="text-[11px] text-rose-600 mt-1">{errors.panNumber}</p>}
              </div>

              {/* Password & Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1" htmlFor="password">
                    Create Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      id="password"
                      type="password"
                      placeholder="Min. 6 characters"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border bg-gray-50 focus:bg-white focus:outline-none transition ${
                        errors.password ? 'border-rose-400 ring-1 ring-rose-300' : 'border-gray-300 focus:border-blue-600'
                      }`}
                    />
                  </div>
                  {errors.password && <p className="text-[11px] text-rose-600 mt-1">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1" htmlFor="confirmPassword">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      id="confirmPassword"
                      type="password"
                      placeholder="Re-type password"
                      value={formData.confirmPassword}
                      onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border bg-gray-50 focus:bg-white focus:outline-none transition ${
                        errors.confirmPassword ? 'border-rose-400 ring-1 ring-rose-300' : 'border-gray-300 focus:border-blue-600'
                      }`}
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-[11px] text-rose-600 mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>

              {/* Statutory Terms Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 text-xs text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.termsAgreed}
                    onChange={e => setFormData({ ...formData, termsAgreed: e.target.checked })}
                    className="mt-0.5 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span>
                    I solemnly declare that all particulars entered herein are accurate and represent a genuine industrial enterprise proposed in the State of Maharashtra.
                  </span>
                </label>
                {errors.termsAgreed && <p className="text-[11px] text-rose-600 mt-1">{errors.termsAgreed}</p>}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-4 py-3 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl shadow-md hover:shadow-lg transition transform active:scale-98 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Registering Industrial Account...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Signup & Proceed to Login</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Step Guidance Footer */}
            <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-2">
              <span>Already registered your enterprise?</span>
              <Link to="/login" className="text-blue-700 font-bold hover:underline flex items-center gap-1">
                <span>Go to Login (Step 2)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
