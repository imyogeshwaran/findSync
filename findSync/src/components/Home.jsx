import React from 'react';
import Threads from '../components/Prism.jsx';
import { FloatingDock } from './ui/hyperspeed/floating-dock.jsx';
import { IconHome, IconCompass, IconSearch, IconUser } from '@tabler/icons-react';

export default function Home() {
  const dockItems = [
    { title: 'Home', href: '#', icon: <IconHome className="h-6 w-6 text-neutral-200" /> },
    { title: 'Explore', href: '#', icon: <IconCompass className="h-6 w-6 text-neutral-200" /> },
    { title: 'Find My Product', href: '#', icon: <IconSearch className="h-6 w-6 text-neutral-200" /> },
    { title: 'My Account', href: '#', icon: <IconUser className="h-6 w-6 text-neutral-200" /> },
  ];

  return (
    <div style={{ background: '#000000', minHeight: '100vh', color: '#000000' }}>
      {/* Threads full-screen animated background for Home */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          <Threads amplitude={1} distance={0} enableMouseInteraction={true} />
        </div>
      </div>

      {/* Bottom floating dock navbar */}
      <FloatingDock
        items={dockItems}
        desktopClassName="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        mobileClassName="z-50"
      />
    </div>
  );
}