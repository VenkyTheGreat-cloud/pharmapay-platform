import { Link } from 'react-router-dom';
import { Pill } from 'lucide-react';

export default function AuthNavBar() {
    return (
        <nav className="w-full bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                    <Pill className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold text-gray-900">
                    Pharma<span className="text-emerald-500">Gig</span>
                </span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
                <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Home</a>
                <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Features</a>
                <a href="#" className="text-sm text-gray-600 hover:text-gray-900">How It Works</a>
                <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Pricing</a>
            </div>

            <div className="flex items-center gap-3">
                <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900">Log in</Link>
                <Link
                    to="/signup"
                    className="text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-lg transition-colors flex items-center gap-1"
                >
                    Get Started <span>&rarr;</span>
                </Link>
            </div>
        </nav>
    );
}
