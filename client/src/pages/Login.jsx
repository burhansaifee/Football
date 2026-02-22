import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Trophy, Eye, EyeOff } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input } from '../components/ui';
import { useToast } from '../components/ui/Toast';
import api from '../api';
import { auth, googleProvider } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, deleteUser } from 'firebase/auth';

const Login = () => {
    const [activeTab, setActiveTab] = useState('login');
    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [registerData, setRegisterData] = useState({ username: '', email: '', password: '', tournamentName: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    const switchTab = (tab) => {
        setActiveTab(tab);
    };

    const handleLoginChange = (e) => {
        setLoginData({ ...loginData, [e.target.name]: e.target.value });
    };

    const handleRegisterChange = (e) => {
        setRegisterData({ ...registerData, [e.target.name]: e.target.value });
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Intelligent Username parsing: Support legacy/team usernames by appending the hidden dummy email suffix
            let loginIdentifier = loginData.email.trim();
            if (!loginIdentifier.includes('@')) {
                loginIdentifier = `${loginIdentifier.toLowerCase().replace(/[^a-z0-9]/g, '')}@bidder.local`;
            }

            // 1. Authenticate with Firebase
            const userCredential = await signInWithEmailAndPassword(auth, loginIdentifier, loginData.password);

            // 2. Get the Firebase ID Token
            const token = await userCredential.user.getIdToken();

            // 3. Sync with our MongoDB Backend, passing the token in the header
            const response = await api.post('/auth/login', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const { user } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            toast.success('Welcome back!', `Successfully logged in as ${user.username}`);

            if (user.role === 'admin') {
                if (user.tournamentId) {
                    navigate('/admin');
                } else {
                    navigate('/admin/tournaments');
                }
            } else {
                navigate('/bidder');
            }
        } catch (error) {
            console.error(error);
            if (error.response?.status === 404 && auth.currentUser) {
                // This is an orphaned Firebase user from a previous failed registration.
                await deleteUser(auth.currentUser);
                toast.error('Incomplete Registration', 'Your previous registration failed in our database. Your account has been reset. Please switch to the Register tab and try again with a unique username.');
                setActiveTab('register');
            } else {
                toast.error('Login failed', error.response?.data?.error || error.message || 'Invalid credentials');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { username, email, password, tournamentName } = registerData;

            let firebaseUid;
            let userCredential;

            // 1. Create User in Firebase Auth
            userCredential = await createUserWithEmailAndPassword(auth, email, password);
            firebaseUid = userCredential.user.uid;

            // 2. Sync profile details down to backend
            try {
                await api.post('/auth/register', {
                    username,
                    email,
                    firebaseUid,
                    role: 'admin',
                    tournamentName
                });
            } catch (err) {
                // Critical: if our backend rejects the DB save (eg duplicate username),
                // we must DELETE the orphaned Firebase account to allow them to retry.
                if (userCredential?.user) {
                    await deleteUser(userCredential.user);
                }
                throw err;
            }

            toast.success('Registration successful!', 'Please login with your new credentials');
            setRegisterData({ username: '', email: '', password: '', tournamentName: '' });
            setActiveTab('login');
        } catch (error) {
            console.error(error);
            toast.error('Registration failed', error.response?.data?.error || error.message || 'Unable to create account');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        try {
            // 1. Popup Google Login
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            const token = await user.getIdToken();

            // 2. Try Login First
            try {
                const loginResponse = await api.post('/auth/login', {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const dbUser = loginResponse.data.user;
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(dbUser));
                toast.success('Welcome back!', `Successfully logged in via Google`);

                if (dbUser.role === 'admin') {
                    if (dbUser.tournamentId) navigate('/admin');
                    else navigate('/admin/tournaments');
                } else {
                    navigate('/bidder');
                }
            } catch (loginError) {
                // If 404 naturally from Login, it means they are a new user. Auto-register them.
                if (loginError.response && loginError.response.status === 404) {
                    try {
                        await api.post('/auth/register', {
                            username: user.displayName || user.email.split('@')[0],
                            email: user.email,
                            firebaseUid: user.uid,
                            role: 'admin',
                            tournamentName: ''
                        });

                        // Now that they are registered, login again to fetch full profile
                        const secondLoginResponse = await api.post('/auth/login', {}, {
                            headers: { Authorization: `Bearer ${token}` }
                        });

                        const newDbUser = secondLoginResponse.data.user;
                        localStorage.setItem('token', token);
                        localStorage.setItem('user', JSON.stringify(newDbUser));
                        toast.success('Account Created!', `Successfully registered via Google`);
                        navigate('/admin/tournaments');
                    } catch (registrationError) {
                        // Registration failed (e.g., username taken), delete Firebase authentication instance
                        await deleteUser(user);
                        throw registrationError;
                    }
                } else {
                    throw loginError;
                }
            }
        } catch (error) {
            console.error(error);
            toast.error('Google Sign In failed', error.response?.data?.error || error.message || 'Authentication error');
        } finally {
            setLoading(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                duration: 0.5,
                ease: "easeOut"
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <motion.div
                className="w-full max-w-md"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Logo Section */}
                <motion.div variants={itemVariants} className="text-center mb-8">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-xl">
                        <Trophy className="h-10 w-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Auction Pro</h1>
                    <p className="text-blue-100">Premium Bidding Experience</p>
                </motion.div>

                {/* Auth Card */}
                <motion.div variants={itemVariants}>
                    <Card className="shadow-xl border-0">
                        <CardHeader className="text-center pb-6">
                            <CardTitle className="text-2xl">Welcome Back</CardTitle>
                            <CardDescription>
                                Sign in to your account or create a new one
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            {/* Tab Switcher */}
                            <div className="flex bg-bg-muted rounded-lg p-1 mb-6">
                                <Button
                                    variant={activeTab === 'login' ? 'primary' : 'ghost'}
                                    className={`flex-1 py-2 px-4 rounded-md transition-all ${activeTab === 'login'
                                        ? 'shadow-sm'
                                        : 'hover:bg-bg-card'
                                        }`}
                                    onClick={() => switchTab('login')}
                                >
                                    Login
                                </Button>
                                <Button
                                    variant={activeTab === 'register' ? 'primary' : 'ghost'}
                                    className={`flex-1 py-2 px-4 rounded-md transition-all ${activeTab === 'register'
                                        ? 'shadow-sm'
                                        : 'hover:bg-bg-card'
                                        }`}
                                    onClick={() => switchTab('register')}
                                >
                                    Register
                                </Button>
                            </div>

                            {/* Login Form */}
                            <AnimatePresence mode="wait">
                                {activeTab === 'login' && (
                                    <motion.form
                                        key="login"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        onSubmit={handleLoginSubmit}
                                        className="space-y-4"
                                    >
                                        <Input
                                            label="Email or Username"
                                            name="email"
                                            type="text"
                                            placeholder="Enter your email or username"
                                            value={loginData.email}
                                            onChange={handleLoginChange}
                                            icon={<User className="h-4 w-4" />}
                                            required
                                        />

                                        <div className="relative">
                                            <Input
                                                label="Password"
                                                name="password"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Enter your password"
                                                value={loginData.password}
                                                onChange={handleLoginChange}
                                                icon={<Lock className="h-4 w-4" />}
                                                required
                                            />
                                            <button
                                                type="button"
                                                className="absolute right-3 top-8 text-text-muted hover:text-text-primary"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>

                                        <Button
                                            type="submit"
                                            className="w-full mt-6"
                                            loading={loading}
                                        >
                                            Sign In
                                        </Button>

                                        <div className="relative my-4">
                                            <div className="absolute inset-0 flex items-center">
                                                <div className="w-full border-t border-border-muted" />
                                            </div>
                                            <div className="relative flex justify-center text-sm">
                                                <span className="px-2 bg-bg-card text-text-muted">Or continue with</span>
                                            </div>
                                        </div>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full bg-white text-gray-900 hover:bg-gray-50 border-gray-200"
                                            onClick={handleGoogleSignIn}
                                            disabled={loading}
                                        >
                                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                                <path
                                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                    fill="#4285F4"
                                                />
                                                <path
                                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                    fill="#34A853"
                                                />
                                                <path
                                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                                    fill="#FBBC05"
                                                />
                                                <path
                                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                                    fill="#EA4335"
                                                />
                                            </svg>
                                            Google
                                        </Button>
                                    </motion.form>
                                )}

                                {/* Register Form */}
                                {activeTab === 'register' && (
                                    <motion.form
                                        key="register"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        onSubmit={handleRegisterSubmit}
                                        className="space-y-4"
                                    >
                                        <Input
                                            label="Username"
                                            name="username"
                                            type="text"
                                            placeholder="Choose a username"
                                            value={registerData.username}
                                            onChange={handleRegisterChange}
                                            icon={<User className="h-4 w-4" />}
                                            required
                                        />

                                        <Input
                                            label="Email Address"
                                            name="email"
                                            type="email"
                                            placeholder="Enter your email"
                                            value={registerData.email}
                                            onChange={handleRegisterChange}
                                            icon={<User className="h-4 w-4" />}
                                            required
                                        />

                                        <div className="relative">
                                            <Input
                                                label="Password"
                                                name="password"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Create a password"
                                                value={registerData.password}
                                                onChange={handleRegisterChange}
                                                icon={<Lock className="h-4 w-4" />}
                                                required
                                            />
                                            <button
                                                type="button"
                                                className="absolute right-3 top-8 text-text-muted hover:text-text-primary"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>

                                        <Input
                                            label="Tournament Name (Optional)"
                                            name="tournamentName"
                                            type="text"
                                            placeholder="e.g. My First League"
                                            value={registerData.tournamentName}
                                            onChange={handleRegisterChange}
                                        />

                                        <Button
                                            type="submit"
                                            className="w-full mt-6"
                                            loading={loading}
                                        >
                                            Create Account
                                        </Button>
                                    </motion.form>
                                )}
                            </AnimatePresence>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Footer */}
                <motion.div
                    variants={itemVariants}
                    className="text-center mt-6 text-sm text-blue-100"
                >
                    <p>© 2024 Auction Pro. All rights reserved.</p>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default Login;
