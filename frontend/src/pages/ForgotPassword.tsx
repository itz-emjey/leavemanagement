import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/axios';
import { ArrowLeft, Mail } from 'lucide-react';

const forgotSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPassword() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotForm) => {
    setError('');
    setIsSubmitting(true);
    try {
      await api.post('/auth/forgot-password', { email: data.email });
      setIsSent(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Forgot Password</h1>
            <p className="text-gray-500 mt-1">We'll send you a reset link</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {isSent ? (
            <div className="text-center space-y-4">
              <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
                If an account with that email exists, a password reset link has been sent.
              </div>
              <Link to="/login" className="btn-primary inline-block">
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  className="input-field"
                  placeholder="you@company.com"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  'Send Reset Link'
                )}
              </button>

              <Link to="/login" className="flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-gray-700">
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
