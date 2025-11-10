'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useLanguage } from '@/lib/use-language'
import { countries } from '@/lib/countries'

export default function SignUpPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [country, setCountry] = useState('')
  const [accountType, setAccountType] = useState<'COMPANY' | 'INDIVIDUAL'>('INDIVIDUAL')
  const [companyName, setCompanyName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [acceptPrivacy, setAcceptPrivacy] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    if (!country) {
      setError('Please select your country')
      return
    }
    
    if (accountType === 'COMPANY' && !companyName.trim()) {
      setError('Company name is required for company accounts')
      return
    }
    
    if (!firstName.trim() || !lastName.trim()) {
      setError('First name and last name are required')
      return
    }
    
    // Validate phone format (E.164 basic check)
    if (phone && !phone.match(/^\+[1-9]\d{1,14}$/)) {
      setError('Phone number must be in E.164 format (e.g., +353123456789)')
      return
    }
    
    // Validate checkboxes
    if (!acceptTerms) {
      setError(t('signup_terms_required'))
      return
    }
    if (!acceptPrivacy) {
      setError(t('signup_privacy_required'))
      return
    }
    
    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          confirmPassword,
          country,
          accountType,
          companyName: accountType === 'COMPANY' ? companyName : null,
          firstName,
          lastName,
          phone: phone || null,
          marketingConsent,
          role: 'CLIENT',
        }),
      })

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error('Failed to parse response:', parseError)
        setError('Failed to register user. Please try again.')
        setLoading(false)
        return
      }

      if (!response.ok) {
        console.error('Registration failed:', data)
        setError(data.error || data.details || t('signup_error'))
        setLoading(false)
        return
      }

      // Registration successful - auto-sign in
      console.log('Registration successful, attempting auto-sign in...', data)
      
      try {
        // Use signIn from next-auth/react
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
          callbackUrl: '/client/dashboard',
        })

        if (result?.error) {
          console.error('Auto-sign in failed:', result.error)
          // If auto-sign in fails, show success message and redirect to sign in
          setSuccess(true)
          setTimeout(() => {
            window.location.href = '/auth/signin?registered=true'
          }, 2000)
        } else if (result?.ok) {
          console.log('Auto-sign in successful, redirecting to dashboard...')
          // Successfully signed in, wait a bit for cookie to be set
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // Use window.location for full page reload to ensure session is loaded
          window.location.href = '/client/dashboard'
        } else {
          // Unknown result, try redirecting anyway
          console.warn('Unknown signIn result:', result)
          await new Promise(resolve => setTimeout(resolve, 500))
          window.location.href = '/client/dashboard'
        }
      } catch (err) {
        console.error('Error during auto-sign in:', err)
        // Show success message and redirect to sign in
        setSuccess(true)
        setTimeout(() => {
          window.location.href = '/auth/signin?registered=true'
        }, 2000)
      }
    } catch (err) {
      console.error('Registration error:', err)
      setError(err instanceof Error ? err.message : t('signup_error'))
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <div className="text-center">
            <div className="text-green-600 text-5xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-gray-900">{t('signup_success_title')}</h2>
            <p className="mt-2 text-gray-600">{t('signup_success_message')}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            {t('signup_title')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('signup_subtitle')}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                Country <span className="text-red-500">*</span>
              </label>
              <select
                id="country"
                name="country"
                required
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select your country</option>
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Type <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="accountType"
                    value="INDIVIDUAL"
                    checked={accountType === 'INDIVIDUAL'}
                    onChange={(e) => setAccountType(e.target.value as 'INDIVIDUAL')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Individual</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="accountType"
                    value="COMPANY"
                    checked={accountType === 'COMPANY'}
                    onChange={(e) => setAccountType(e.target.value as 'COMPANY')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Company</span>
                </label>
              </div>
            </div>
            
            {accountType === 'COMPANY' && (
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  required={accountType === 'COMPANY'}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {t('signup_email')} <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                {t('signup_phone')} (E.164 format, e.g., +353123456789)
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+353123456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Include country code (e.g., +353 for Ireland)</p>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t('signup_password')} <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="marketing-consent"
                  name="marketing-consent"
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={(e) => setMarketingConsent(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="marketing-consent" className="text-gray-700">
                  I would like to receive marketing communications (optional)
                </label>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="accept-terms"
                  name="accept-terms"
                  type="checkbox"
                  required
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="accept-terms" className="text-gray-700">
                  {t('signup_accept_terms')}{' '}
                  <Link href="/terms" target="_blank" className="text-blue-600 hover:text-blue-500 underline">
                    {t('signup_terms_link')}
                  </Link>
                </label>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="accept-privacy"
                  name="accept-privacy"
                  type="checkbox"
                  required
                  checked={acceptPrivacy}
                  onChange={(e) => setAcceptPrivacy(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="accept-privacy" className="text-gray-700">
                  {t('signup_accept_privacy')}{' '}
                  <Link href="/privacy" target="_blank" className="text-blue-600 hover:text-blue-500 underline">
                    {t('signup_privacy_link')}
                  </Link>
                </label>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? t('signup_button_loading') : t('signup_button')}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              {t('signup_already_have')}{' '}
              <Link href="/auth/signin" className="font-medium text-blue-600 hover:text-blue-500">
                {t('signup_sign_in')}
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

