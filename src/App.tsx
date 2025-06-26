// src/App.tsx
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminDashboard from '@/pages/AdminDashboard';
import { Toaster } from 'sonner';
import AdminNewOrder from './components/admin/AdminNewOrder';
import LoginPage from "@/pages/LoginPage";

function App() {
    return (
        <Router>
            <div className="min-h-screen">
                <Routes>
                    {/* Route dynamique pour admin dashboard */}
                    <Route path="/" element={<LoginPage />} />
                    <Route path="/:restaurantSlug/" element={<AdminDashboard />} />
                    <Route path="/:restaurantSlug/commande" element={<AdminNewOrder />} />
                </Routes>

                <Toaster
                    position="top-right"
                    richColors
                    toastOptions={{
                        style: {
                            background: 'rgba(31, 41, 55, 0.95)',
                            border: '1px solid rgba(107, 114, 128, 0.5)',
                            color: 'white',
                        },
                    }}
                />
            </div>
        </Router>
    );
}

export default App;