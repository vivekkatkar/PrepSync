
import { User, Crown, Settings, Bell, LogOut, Edit2, FileText } from 'lucide-react';

export function formatTitle(key) {
  return key
    .split('_')
    .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export const navOptions = [
              { id: 'overview', icon: User, label: 'Overview' },
              { id: 'profile', icon: Edit2, label: 'Profile' },
              { id: 'subscription', icon: Crown, label: 'Plan' },
              { id: 'reports', icon: FileText, label: 'Reports' }
      ]

