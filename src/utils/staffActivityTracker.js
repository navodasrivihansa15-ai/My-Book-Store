import { supabase } from '../supabaseClient'; // Adjust path if needed

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const STORAGE_KEY = 'alexandria_active_staff_session';

export const detectPlatform = () => {
  const ua = navigator.userAgent || '';
  const isElectron = Boolean(window.electronAPI) || ua.toLowerCase().includes('electron');
  if (isElectron) return 'WINDOWS_EXE';

  const isStandalone = window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator.standalone === true;
  const isMobile = /Android|iPhone|iPad|iPod/i.test(ua) || window.innerWidth <= 768;

  if (isStandalone && isMobile) return 'MOBILE_PWA';
  if (isStandalone) return 'DESKTOP_PWA';
  if (isMobile) return 'MOBILE_WEB';
  return 'DESKTOP_WEB';
};

export const getActiveStaffIdentity = (explicitUser = null) => {
  if (explicitUser && (explicitUser.full_name || explicitUser.username || explicitUser.email)) {
    return {
      name: String(explicitUser.full_name || explicitUser.username || explicitUser.email).trim(),
      role: String(explicitUser.role || 'STAFF').toUpperCase()
    };
  }
  const keysToCheck = [STORAGE_KEY, 'pos_scanner_active_user', 'pos_active_user', 'user'];
  for (const k of keysToCheck) {
    try {
      const raw = localStorage.getItem(k);
      if (raw) {
        const parsed = JSON.parse(raw);
        const name = parsed.user_name || parsed.full_name || parsed.username || parsed.name;
        const role = parsed.user_role || parsed.role || 'STAFF';
        if (name) return { name: String(name).trim(), role: String(role).toUpperCase() };
      }
    } catch (e) {}
  }
  return null;
};

// Non-blocking background runner — guarantees POS/Scanner UI never freezes or blinks
const runInBackground = (fn) => {
  setTimeout(() => {
    Promise.resolve()
      .then(fn)
      .catch((err) => console.warn('[Audit Background Bus] Ignored error:', err));
  }, 50);
};

export const startStaffSession = (userName, userRole = 'STAFF') => {
  if (!userName) return Promise.resolve(null);
  const cleanName = String(userName).trim();
  const cleanRole = String(userRole || 'STAFF').toUpperCase();

  return new Promise((resolve) => {
    runInBackground(async () => {
      const existingRaw = localStorage.getItem(STORAGE_KEY);
      if (existingRaw) {
        try {
          const existing = JSON.parse(existingRaw);
          if (existing.id && existing.user_name?.toLowerCase() === cleanName.toLowerCase()) {
            return resolve(existing);
          }
        } catch (e) {}
      }

      const platform = detectPlatform();
      const nowIso = new Date().toISOString();

      const { data, error } = await supabase
        .from('staff_sessions')
        .insert([{
          user_name: cleanName,
          user_role: cleanRole,
          platform,
          login_at: nowIso,
          last_heartbeat_at: nowIso,
          status: 'ACTIVE',
          sales_count: 0,
          total_revenue: 0,
          scans_count: 0,
          voids_count: 0,
          payments_verified_count: 0,
          orders_packed_count: 0,
          orders_shipped_count: 0,
          inventory_edits_count: 0,
          admin_actions_count: 0
        }])
        .select()
        .single();

      if (!error && data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        resolve(data);
      } else {
        resolve(null);
      }
    });
  });
};

export const syncSessionHeartbeat = () => {
  runInBackground(async () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    if (!s?.id) return;

    const now = Date.now();
    const loginTime = new Date(s.login_at).getTime();
    const durationMins = Math.max(1, Math.round((now - loginTime) / 60000));
    const nowIso = new Date(now).toISOString();

    s.last_heartbeat_at = nowIso;
    s.duration_minutes = durationMins;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));

    await supabase
      .from('staff_sessions')
      .update({
        last_heartbeat_at: nowIso,
        duration_minutes: durationMins,
        sales_count: s.sales_count || 0,
        total_revenue: s.total_revenue || 0,
        scans_count: s.scans_count || 0,
        voids_count: s.voids_count || 0,
        payments_verified_count: s.payments_verified_count || 0,
        orders_packed_count: s.orders_packed_count || 0,
        orders_shipped_count: s.orders_shipped_count || 0,
        inventory_edits_count: s.inventory_edits_count || 0,
        admin_actions_count: s.admin_actions_count || 0
      })
      .eq('id', s.id);
  });
};

// Fire-and-forget Action Logger (Never blocks UI!)
export const logStaffAction = (actionType, description, metadata = {}, explicitUser = null) => {
  runInBackground(async () => {
    let raw = localStorage.getItem(STORAGE_KEY);
    let s = raw ? JSON.parse(raw) : null;

    if (!s || !s.id) {
      const identity = getActiveStaffIdentity(explicitUser);
      if (!identity) return;
      s = await startStaffSession(identity.name, identity.role);
      if (!s) return;
    }

    let category = 'ADMIN';
    switch (actionType) {
      case 'SALE_COMPLETED':
        category = 'POS';
        s.sales_count = (s.sales_count || 0) + 1;
        s.total_revenue = Number(s.total_revenue || 0) + Number(metadata.amount || 0);
        break;
      case 'BARCODE_SCANNED':
        category = 'POS';
        s.scans_count = (s.scans_count || 0) + 1;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
        return; // Only update local counter, zero DB network calls during scanning!
      case 'ORDER_VOIDED':
        category = 'POS';
        s.voids_count = (s.voids_count || 0) + 1;
        break;
      case 'PAYMENT_VERIFIED':
        category = 'ORDERS';
        s.payments_verified_count = (s.payments_verified_count || 0) + 1;
        s.admin_actions_count = (s.admin_actions_count || 0) + 1;
        break;
      case 'ORDER_PACKED':
        category = 'ORDERS';
        s.orders_packed_count = (s.orders_packed_count || 0) + 1;
        s.admin_actions_count = (s.admin_actions_count || 0) + 1;
        break;
      case 'ORDER_SHIPPED':
        category = 'ORDERS';
        s.orders_shipped_count = (s.orders_shipped_count || 0) + 1;
        s.admin_actions_count = (s.admin_actions_count || 0) + 1;
        break;
      default:
        category = metadata.category || 'INVENTORY';
        s.inventory_edits_count = (s.inventory_edits_count || 0) + 1;
        s.admin_actions_count = (s.admin_actions_count || 0) + 1;
        break;
    }

    s.last_heartbeat_at = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));

    await supabase.from('staff_audit_logs').insert([{
      session_id: s.id,
      user_name: s.user_name,
      user_role: s.user_role,
      platform: s.platform || detectPlatform(),
      category,
      target_id: String(metadata.orderId || metadata.bookId || ''),
      action_type: actionType,
      description,
      metadata
    }]);

    syncSessionHeartbeat();
  });
};

export const endStaffSession = (reason = 'LOGGED_OUT') => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const s = JSON.parse(raw);
    if (!s?.id) return;
    const now = Date.now();
    const loginTime = new Date(s.login_at).getTime();
    const durationMins = Math.max(1, Math.round((now - loginTime) / 60000));
    const nowIso = new Date(now).toISOString();

    const payload = {
      logout_at: nowIso,
      last_heartbeat_at: nowIso,
      duration_minutes: durationMins,
      status: reason,
      sales_count: s.sales_count || 0,
      total_revenue: s.total_revenue || 0,
      scans_count: s.scans_count || 0,
      voids_count: s.voids_count || 0,
      payments_verified_count: s.payments_verified_count || 0,
      orders_packed_count: s.orders_packed_count || 0,
      orders_shipped_count: s.orders_shipped_count || 0,
      inventory_edits_count: s.inventory_edits_count || 0,
      admin_actions_count: s.admin_actions_count || 0
    };

    localStorage.removeItem(STORAGE_KEY);

    if (SUPABASE_URL && SUPABASE_KEY) {
      fetch(`${SUPABASE_URL}/rest/v1/staff_sessions?id=eq.${s.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(() => {});
    }
  } catch (e) {}
};

export const initGlobalSessionLifecycle = (activeUser = null) => {
  if (activeUser && (activeUser.full_name || activeUser.username)) {
    const role = String(activeUser.role || 'STAFF').toUpperCase();
    startStaffSession(activeUser.full_name || activeUser.username, role);
  }

  const interval = setInterval(() => {
    if (document.visibilityState === 'visible') syncSessionHeartbeat();
  }, 5 * 60 * 1000);

  const handleUnload = () => endStaffSession('APP_CLOSED');
  window.addEventListener('pagehide', handleUnload);
  window.addEventListener('beforeunload', handleUnload);

  return () => {
    clearInterval(interval);
    window.removeEventListener('pagehide', handleUnload);
    window.removeEventListener('beforeunload', handleUnload);
  };
};
