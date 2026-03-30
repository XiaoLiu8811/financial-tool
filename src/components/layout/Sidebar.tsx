import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowUpDown, Upload, Tags, Menu } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowUpDown, label: 'Transactions' },
  { to: '/import', icon: Upload, label: 'Import CSV' },
  { to: '/categories', icon: Tags, label: 'Categories' },
];

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <aside className={`bg-white border-r border-gray-200 transition-all duration-300 flex flex-col ${sidebarOpen ? 'w-64' : 'w-16'}`}>
      <div className="p-4 flex items-center justify-between border-b border-gray-200">
        {sidebarOpen && (
          <h1 className="text-lg font-bold text-primary-700 whitespace-nowrap">
            Finance Tracker
          </h1>
        )}
        <button onClick={toggleSidebar} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
          <Menu size={20} />
        </button>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <Icon size={20} />
            {sidebarOpen && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
