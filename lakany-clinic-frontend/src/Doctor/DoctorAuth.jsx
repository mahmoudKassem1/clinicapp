import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { LanguageContext } from '../patient/LanguageContext';
import { User, Phone, Mail, Lock, ArrowLeft } from 'lucide-react';
import logo from '../assets/logo-removebg-preview.png';
import toast from 'react-hot-toast';
import { loginEnterprise, registerEnterprise } from './doctorApi';

// Helper component
const InputField = ({ icon, placeholder, type = 'text', value, onChange, isArabic, autocomplete }) => (
  <div className="relative group">
    <div className={`absolute inset-y-0 ${isArabic ? 'right-4' : 'left-4'} flex items-center pointer-events-none transition-colors group-focus-within:text-blue-600 text-slate-400`}>
      {icon}
    </div>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`w-full ${isArabic ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all text-slate-700 placeholder:text-slate-400`}
      autoComplete={autocomplete}
    />
  </div>
);

const DoctorAuth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { language } = useContext(LanguageContext);
  const navigate = useNavigate();
  const isArabic = language === 'ar';

  const [password, setPassword] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const blueFilter = "brightness(0) saturate(100%) invert(18%) sepia(88%) saturate(3451%) hue-rotate(215deg) brightness(91%) contrast(101%)";

  const text = {
    en: {
      login: 'Doctor Login',
      signup: 'Doctor Sign Up',
      email: 'Email Address',
      password: 'Password',
      identifier: 'Email',
      loginPrompt: "Don't have an account?",
      signupPrompt: 'Already have an account?',
      back: 'Back to Home',
      clinicName: 'Lakany Pain Clinic',
      loginSuccess: 'Doctor Login Successful!',
      signupSuccess: 'Signup successful! Please log in.',
      loadingLogin: 'Signing in...',
      loadingSignup: 'Creating account...',
      error: 'An error occurred. Please try again.',
      validationIdentifier: 'Please enter your email.',
      validationPassword: 'Password is required.',
      signupError: 'Registration failed. A doctor account may already exist.',
    },
    ar: {
      login: 'تسجيل دخول الطبيب',
      signup: 'تسجيل طبيب جديد',
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      identifier: 'البريد الإلكتروني',
      loginPrompt: 'ليس لديك حساب؟',
      signupPrompt: 'هل لديك حساب بالفعل؟',
      back: 'العودة للرئيسية',
      clinicName: 'عيادة لاكاني',
      loginSuccess: 'تم تسجيل دخول الطبيب بنجاح!',
      signupSuccess: 'تم التسجيل بنجاح! يرجى تسجيل الدخول.',
      loadingLogin: 'جاري تسجيل الدخول...',
      loadingSignup: 'جاري إنشاء الحساب...',
      error: 'حدث خطأ. يرجى المحاولة مرة أخرى.',
      validationIdentifier: 'يرجى إدخال بريدك الإلكتروني.',
      validationPassword: 'كلمة المرور مطلوبة.',
      signupError: 'فشل التسجيل. قد يكون حساب الطبيب موجودًا بالفعل.',
    },
  };

  const t = text[language];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!identifier) return toast.error(t.validationIdentifier);
    if (!password) return toast.error(t.validationPassword);

    setIsLoading(true);

    if (isLogin) {
      // --- LOGIN LOGIC ---
      try {
        // 1. Get the Full Axios Response
        const response = await loginEnterprise({
          email: identifier,
          password,
        });

        // 2. Extract Data from Response Body
        const data = response.data; // This is where the token lives

        if (data && data.token) {
          toast.success(t.loginSuccess);
          
          // ✅ FIX: Save correct token & user data
          localStorage.setItem('doctor_token', data.token);
          
          if (data.user) {
             localStorage.setItem('doctor_user', JSON.stringify(data.user));
             // Optional: Save role specifically if needed elsewhere
             localStorage.setItem('doctor_userRole', data.user.role || 'doctor');
          }

          // 3. Navigate
          navigate('/doctor/dashboard', { replace: true });
        } else {
          throw new Error('Login successful, but token is missing from response.');
        }

      } catch (err) {
        // Handle Axios Error Structure
        const errorMessage = err.response?.data?.message || err.message || t.error;
        toast.error(errorMessage);
        console.error("Login failed:", err);
      } finally {
        setIsLoading(false);
      }

    } else {
      // --- SIGNUP LOGIC ---
      try {
        const userData = {
            email: identifier,
            password: password,
            username: identifier.split('@')[0],
            phone: `+${Date.now()}` // Temporary phone generation
        };

        await registerEnterprise(userData);

        toast.success(t.signupSuccess);
        setIsLogin(true); 
        setIdentifier('');
        setPassword('');

      } catch (err) {
        const errorMessage = err.response?.data?.message || t.signupError;
        toast.error(errorMessage);
        console.error("Signup failed:", err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className={`min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 relative overflow-hidden ${isArabic ? 'font-arabic' : ''}`} dir={isArabic ? 'rtl' : 'ltr'}>
      
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-[120px] opacity-60" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-50 rounded-full blur-[120px] opacity-60" />

      {/* Back Button */}
      <div className={`absolute top-6 lg:top-10 w-full px-6 lg:px-12 flex ${isArabic ? 'justify-end' : 'justify-start'}`}>
        <button 
          onClick={() => navigate('/')}
          className="group flex items-center gap-3 text-sm font-bold text-slate-500 hover:text-blue-700 transition-all"
        >
          <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 group-hover:shadow-md transition-all">
            <ArrowLeft size={18} className={isArabic ? 'rotate-180' : ''} />
          </div>
          <span>{t.back}</span>
        </button>
      </div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <img 
            src={logo} 
            alt="Clinic Logo" 
            style={{ filter: blueFilter }}
            className="w-16 h-16 mx-auto mb-3 object-contain" 
          />
          <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">
            {t.clinicName}
          </h2>
        </div>

        <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.04)] border border-white p-8 lg:p-10">
          
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${isLogin ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t.login}
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${!isLogin ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t.signup}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Standard div instead of motion.div */}
            <div className="space-y-4 transition-all duration-300 ease-in-out">
              <InputField 
                isArabic={isArabic}
                icon={<Mail size={20} />} 
                placeholder={t.identifier} 
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autocomplete="username"
              />
              
              <InputField 
                isArabic={isArabic}
                icon={<Lock size={20} />} 
                placeholder={t.password} 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autocomplete="current-password"
              />
            </div>
            
            <button
              type="submit"
              className="w-full py-4 text-base font-bold text-white rounded-2xl shadow-xl shadow-blue-100 bg-[#1e40af] hover:bg-blue-800 transition-all mt-4 disabled:opacity-75"
              disabled={isLoading}
            >
              {isLoading ? (isLogin ? t.loadingLogin : t.loadingSignup) : (isLogin ? t.login : t.signup)}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500 font-medium">
              {isLogin ? t.loginPrompt : t.signupPrompt}{' '}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-blue-700 font-bold hover:underline underline-offset-4 decoration-2"
              >
                {!isLogin ? t.login : t.signup}
              </button>
            </p>
          </div>
        </div>

        <p className="mt-10 text-center text-[10px] text-slate-400 uppercase tracking-widest">
          © {new Date().getFullYear()} Lakany Clinic • Secure Access
        </p>
      </div>
    </div>
  );
};

export default DoctorAuth;