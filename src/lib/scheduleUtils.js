export function safeParseJsonArray(str, fallback = []) {
  if (Array.isArray(str)) return str;
  if (!str || typeof str !== 'string') return fallback;
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function getTodayStr() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getDayOfWeek(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

export function sortTimeSlots(slots) {
  return [...new Set(slots)].sort((a, b) => a.localeCompare(b));
}

export function computeDaySchedule({
  dateStr,
  workingDays = [1, 2, 3, 4, 5, 6],
  defaultSlots = ['09:00', '10:30', '12:00', '14:00', '15:30', '17:00', '18:30'],
  override = null,
  busySlots = [],
}) {
  const weekday = getDayOfWeek(dateStr);
  const isDefaultWorkingDay = workingDays.includes(weekday);
  const isDayOff = override ? Boolean(override.isDayOff) : !isDefaultWorkingDay;

  if (isDayOff) {
    return {
      date: dateStr,
      isDayOff: true,
      note: override?.note || '',
      allSlots: [],
      availableSlots: [],
      blockedSlots: safeParseJsonArray(override?.blockedSlots, []),
      extraSlots: safeParseJsonArray(override?.extraSlots, []),
      busySlots,
    };
  }

  const blocked = safeParseJsonArray(override?.blockedSlots, []);
  const extra = safeParseJsonArray(override?.extraSlots, []);
  const combined = sortTimeSlots([...defaultSlots, ...extra]).filter((s) => !blocked.includes(s));

  const today = getTodayStr();
  let finalAvailable = combined.filter((s) => !busySlots.includes(s));

  // Also filter out past hours if dateStr === today
  if (dateStr === today) {
    const now = new Date();
    const curMinutes = now.getHours() * 60 + now.getMinutes() + 60; // Require at least 1 hour notice
    finalAvailable = finalAvailable.filter((slot) => {
      const [hh, mm] = slot.split(':').map(Number);
      return hh * 60 + mm > curMinutes;
    });
  } else if (dateStr < today) {
    finalAvailable = [];
  }

  return {
    date: dateStr,
    isDayOff: false,
    note: override?.note || '',
    allSlots: combined,
    availableSlots: finalAvailable,
    blockedSlots: blocked,
    extraSlots: extra,
    busySlots,
  };
}

export function normalizePhoneDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

export function getTelegramUrl(phoneOrHandle) {
  const raw = String(phoneOrHandle || '').trim();
  if (!raw) return '#';
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  if (raw.startsWith('@')) return `https://t.me/${raw.slice(1)}`;
  const cleaned = raw.startsWith('+') ? raw : `+${raw.replace(/\D/g, '')}`;
  return `https://t.me/${cleaned}`;
}

export function getViberUrl(phone) {
  const digits = normalizePhoneDigits(phone);
  return digits ? `viber://chat?number=%2B${digits}` : '#';
}

export function getWhatsappUrl(phone) {
  const digits = normalizePhoneDigits(phone);
  return digits ? `https://wa.me/${digits}` : '#';
}

export function generateBookingCode(prefix) {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${num}`;
}
