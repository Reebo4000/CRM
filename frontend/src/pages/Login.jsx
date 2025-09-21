import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ThemeToggle from '../components/ThemeToggle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input, FormField, FormGroup } from '../components/ui/Input';
import { Eye, EyeOff, Zap, ShoppingBag } from 'lucide-react';

// Validation schema
const loginSchema = yup.object({
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isAuthenticated, isLoading, error, clearError } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm({
    resolver: yupResolver(loginSchema),
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Clear auth errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const onSubmit = async (data) => {
    clearError();

    const result = await login(data);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError('root', {
        type: 'manual',
        message: result.error,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      {/* Top Controls */}
      <div className="absolute top-4 right-4 rtl:right-auto rtl:left-4 flex items-center gap-2">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>

      <div className="max-w-md w-full">
        <Card className="shadow-large">
          <CardHeader className="text-center">
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-2xl bg-primary text-primary-foreground mb-4">
              <Zap className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {t('auth.signInTitle')}
            </CardTitle>
            <CardDescription>
              {t('auth.subtitle')}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {/* Display auth error */}
              {(error || errors.root) && (
                <Card className="border-destructive bg-destructive/5">
                  <CardContent className="p-4">
                    <div className="text-sm text-destructive">
                      {error || errors.root?.message}
                    </div>
                  </CardContent>
                </Card>
              )}

              <FormGroup>
                {/* Email field */}
                <FormField
                  label={t('auth.email')}
                  error={errors.email?.message}
                  required
                >
                  <Input
                    {...register('email')}
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder={t('auth.emailPlaceholder')}
                    error={!!errors.email}
                  />
                </FormField>

                {/* Password field */}
                <FormField
                  label={t('auth.password')}
                  error={errors.password?.message}
                  required
                >
                  <Input
                    {...register('password')}
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder={t('auth.passwordPlaceholder')}
                    error={!!errors.password}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    }
                  />
                </FormField>
              </FormGroup>

              <Button
                type="submit"
                disabled={isSubmitting}
                loading={isSubmitting}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? t('auth.signingIn') : t('auth.signIn')}
              </Button>

             
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
