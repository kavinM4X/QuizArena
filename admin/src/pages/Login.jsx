import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';
import styles from './Login.module.css';

const Login = () => {
  const { login, register: authRegister, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    let result;
    if (mode === 'login') {
      result = await login(data.email, data.password);
    } else {
      result = await authRegister(data.name, data.email, data.password);
    }
    if (result?.success) navigate('/dashboard');
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Hero */}
        <div className={styles.hero}>
          <div className={styles.logoMark}>Q</div>
          <h2 className={styles.title}>
            {mode === 'login' ? 'Admin Sign In' : 'Create Admin Account'}
          </h2>
          <p className={styles.sub}>
            {mode === 'login' ? 'Host live quizzes in seconds' : 'Set up your QuizArena admin account'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {mode === 'register' && (
            <Input
              label="Full Name"
              id="name"
              placeholder="Your full name"
              error={errors.name?.message}
              {...register('name', { required: 'Name is required' })}
            />
          )}
          <Input
            label="Email"
            id="email"
            type="email"
            placeholder="you@school.edu"
            error={errors.email?.message}
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' },
            })}
          />
          <Input
            label="Password"
            id="password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 6, message: 'Minimum 6 characters' },
            })}
          />

          <Button type="submit" variant="primary" loading={loading} style={{ marginTop: 6 }}>
            {mode === 'login' ? 'Login' : 'Create Account'}
          </Button>
        </form>

        <div className={styles.switchRow}>
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button className={styles.switchBtn} onClick={() => setMode('register')}>Register</button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button className={styles.switchBtn} onClick={() => setMode('login')}>Sign in</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
