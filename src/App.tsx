/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy, Suspense, useEffect, useState } from 'react';
import { InvitationPage } from './pages/InvitationPage';

// Panel admin dimuat terpisah agar tidak membebani tamu yang hanya membuka undangan.
const AdminPage = lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })));

function useHash(): string {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return hash;
}

export default function App() {
  const hash = useHash();

  // Panel admin sengaja tidak ditautkan dari mana pun; buka lewat URL .../#/admin
  if (hash.startsWith('#/admin')) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-[#171412]" />}>
        <AdminPage />
      </Suspense>
    );
  }

  return <InvitationPage />;
}
