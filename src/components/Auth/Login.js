import React, { useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';

const Login = ({ onClose, switchToSignup }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { signIn, signInWithGoogle, error, loading } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        await signIn(email, password);
        onClose?.();
    };

    const handleGoogleSignIn = async () => {
        await signInWithGoogle();
        onClose?.();
    };

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center mb-4">Login to Watan</h2>
            
            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary"
                        required
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium mb-1">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary"
                        required
                    />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </Button>
            </form>

            <div className="mt-4 text-center text-sm">
                <span className="text-gray-600">Don't have an account? </span>
                <button
                    type="button"
                    onClick={switchToSignup}
                    className="text-primary hover:underline font-medium"
                >
                    Sign up here
                </button>
            </div>

            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
            </div>

            <Button
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={loading}
            >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    {/* Google SVG icon */}
                </svg>
                Sign in with Google
            </Button>
        </div>
    );
};

export default Login;