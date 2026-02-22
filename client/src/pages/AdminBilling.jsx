import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';
import { CreditCard, CheckCircle, AlertTriangle, Loader } from 'lucide-react';
import { DashboardLayout } from '../components/layout';

const AdminBilling = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/');
        }

        const query = new URLSearchParams(location.search);

        if (query.get('success')) {
            setMessage('Subscription successful! Refreshing your account status...');
            // In a real app we might poll or trigger a fetch for updated user details
            setTimeout(() => {
                fetchUserDetails();
                setMessage('');
            }, 3000);
        }

        if (query.get('canceled')) {
            setMessage('Subscription checkout canceled.');
        }

    }, [navigate, user, location]);

    const fetchUserDetails = async () => {
        // Assume an endpoint to get fresh user details, or just rely on the webhook + next login.
        // For simple update: Let's assume hitting an endpoint /auth/me returns latest user data
        // For this mock, we just say checked.
    };

    const handleSubscribe = async (plan) => {
        setLoading(plan);
        try {
            const resScript = await loadRazorpayScript();
            if (!resScript) {
                setMessage('Razorpay SDK failed to load. Are you online?');
                setLoading(false);
                return;
            }

            // Get subscription ID from backend
            const { data } = await api.post('/payments/create-subscription', { plan });

            const options = {
                key: data.key,
                subscription_id: data.subscriptionId,
                name: "Football Auction",
                description: `Subscription to ${plan} tier`,
                handler: async function (response) {
                    try {
                        // Verify payment signature on backend
                        await api.post('/payments/verify-payment', {
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_subscription_id: response.razorpay_subscription_id,
                            razorpay_signature: response.razorpay_signature,
                            plan: plan
                        });
                        setMessage('Subscription successful! Your limits have been updated.');
                        user.subscriptionTier = plan;
                        user.subscriptionStatus = 'active';
                        localStorage.setItem('user', JSON.stringify(user));
                        setUser({ ...user });
                    } catch (error) {
                        setMessage('Payment verification failed.');
                    }
                },
                prefill: {
                    name: user.username,
                },
                theme: {
                    color: "#00d2ff"
                }
            };

            const rzp1 = new window.Razorpay(options);
            rzp1.on('payment.failed', function (response) {
                setMessage(`Payment failed: ${response.error.description}`);
            });
            rzp1.open();

        } catch (error) {
            console.error('Error starting checkout:', error);
            setMessage('Failed to start checkout process.');
        } finally {
            setLoading(false);
        }
    };

    const handleManageBilling = async () => {
        setMessage('To manage billing, please contact support or check your email for the Razorpay customer portal link.');
    };

    return (
        <DashboardLayout user={user}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>

                <header style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <CreditCard size={36} color="var(--primary)" />
                    <div>
                        <h1 style={{ margin: 0, color: 'var(--text-dark)' }}>Billing & Subscription</h1>
                        <p style={{ margin: 0, color: 'var(--text-muted)' }}>Manage your Pro plan and invoices</p>
                    </div>
                </header>

                {message && (
                    <div style={{ padding: '15px', borderRadius: '8px', background: message.includes('success') ? 'var(--bg-card)' : 'rgba(239, 68, 68, 0.1)', color: message.includes('success') ? 'var(--success)' : '#ef4444', border: `1px solid ${message.includes('success') ? 'var(--success)' : '#ef4444'}`, marginBottom: '20px', backdropFilter: 'blur(8px)' }}>
                        {message}
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '20px' }}>
                    {/* Free Plan Card */}
                    <div className={`section-card ${user.subscriptionTier === 'free' ? 'glass active-plan' : 'glass'}`} style={{ display: 'flex', flexDirection: 'column', gap: '15px', border: user.subscriptionTier === 'free' ? '2px solid var(--primary)' : '1px solid var(--border-color)' }}>
                        <h2 style={{ margin: 0 }}>Free Tier</h2>
                        <h3 style={{ margin: 0, fontSize: '2rem', color: 'var(--primary)' }}>$0<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/mo</span></h3>
                        <p style={{ color: 'var(--text-muted)', margin: 0 }}>Perfect for small events.</p>
                        <ul style={{ listStyle: 'none', padding: 0, margin: '15px 0', lineHeight: '1.8', color: 'var(--text-dark)', flexGrow: 1 }}>
                            <li>✅ 1 Tournament maximum</li>
                            <li>✅ 4 Teams maximum</li>
                            <li>✅ 20 Players maximum</li>
                        </ul>
                        {user.subscriptionTier === 'free' ? (
                            <button className="btn-submit secondary" disabled style={{ opacity: 0.7 }}>Current Plan</button>
                        ) : (
                            <button className="btn-submit secondary" disabled style={{ opacity: 0.7 }}>Included</button>
                        )}
                    </div>

                    {/* Basic Plan Card */}
                    <div className={`section-card ${user.subscriptionTier === 'basic' ? 'glass active-plan' : 'glass'}`} style={{ display: 'flex', flexDirection: 'column', gap: '15px', border: user.subscriptionTier === 'basic' ? '2px solid var(--primary)' : '1px solid var(--border-color)' }}>
                        <h2 style={{ margin: 0 }}>Basic Tier</h2>
                        <h3 style={{ margin: 0, fontSize: '2rem', color: 'var(--primary)' }}>$3.3<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/mo</span></h3>
                        <p style={{ color: 'var(--text-muted)', margin: 0 }}>For growing organizers.</p>
                        <ul style={{ listStyle: 'none', padding: 0, margin: '15px 0', lineHeight: '1.8', color: 'var(--text-dark)', flexGrow: 1 }}>
                            <li>✅ 3 Tournaments maximum</li>
                            <li>✅ 20 Teams tournament</li>
                            <li>✅ 100 Players tournament</li>
                        </ul>
                        {user.subscriptionTier === 'basic' && user.subscriptionStatus === 'active' ? (
                            <button onClick={handleManageBilling} disabled={loading === 'manage'} className="btn-submit primary">
                                {loading === 'manage' ? <Loader className="spin" size={16} /> : 'Manage Billing'}
                            </button>
                        ) : (
                            <button onClick={() => handleSubscribe('basic')} disabled={loading !== false} className="btn-submit primary">
                                {loading === 'basic' ? <Loader className="spin" size={16} /> : 'Upgrade to Basic'}
                            </button>
                        )}
                    </div>

                    {/* Pro Plan Card */}
                    <div className={`section-card ${user.subscriptionTier === 'pro' ? 'glass active-plan' : 'glass'}`} style={{ display: 'flex', flexDirection: 'column', gap: '15px', border: user.subscriptionTier === 'pro' ? '2px solid var(--primary)' : '1px solid var(--border-color)' }}>
                        <h2 style={{ margin: 0 }}>Pro Tier</h2>
                        <h3 style={{ margin: 0, fontSize: '2rem', color: 'var(--primary)' }}>$6.06<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/mo</span></h3>
                        <p style={{ color: 'var(--text-muted)', margin: 0 }}>For professional leagues.</p>
                        <ul style={{ listStyle: 'none', padding: 0, margin: '15px 0', lineHeight: '1.8', color: 'var(--text-dark)', flexGrow: 1 }}>
                            <li>✅ Unlimited Tournaments</li>
                            <li>✅ 40 Teams tournament</li>
                            <li>✅ 300 Players tournament</li>
                        </ul>
                        {user.subscriptionTier === 'pro' && user.subscriptionStatus === 'active' ? (
                            <button onClick={handleManageBilling} disabled={loading === 'manage'} className="btn-submit primary">
                                {loading === 'manage' ? <Loader className="spin" size={16} /> : 'Manage Billing'}
                            </button>
                        ) : (
                            <button onClick={() => handleSubscribe('pro')} disabled={loading !== false} className="btn-submit primary">
                                {loading === 'pro' ? <Loader className="spin" size={16} /> : 'Upgrade to Pro'}
                            </button>
                        )}
                    </div>
                </div>

                <p style={{ fontSize: '0.9rem', color: 'var(--text-dark)', marginTop: '30px', textAlign: 'center' }}>
                    <em>* Currently evaluating Razorpay Test Mode. Actual transactions will not be processed.</em>
                </p>
            </div>
        </DashboardLayout>
    );
};

export default AdminBilling;
