'use client';

import { useState, useEffect, useRef } from 'react';
import { getTodayStr } from '@/lib/scheduleUtils';

const MONTH_NAMES_UK = [
  'Січень',
  'Лютий',
  'Березень',
  'Квітень',
  'Травень',
  'Червень',
  'Липень',
  'Серпень',
  'Вересень',
  'Жовтень',
  'Листопад',
  'Грудень',
];

const WEEKDAYS_UK = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

export function formatUkDateLabel(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('uk-UA', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  });
}

export default function MonthCalendarGrid({
  selectedDate,
  onSelectDate,
  allowPastOrOff = false,
  refreshKey = 0,
  onScheduleLoaded,
}) {
  const now = new Date();
  const minMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [daysMap, setDaysMap] = useState({});
  const [loadedKey, setLoadedKey] = useState('');

  const monthStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}`;
  const currentKey = `${monthStr}:${refreshKey}`;
  const loading = loadedKey !== currentKey;

  const callbacksRef = useRef({ onSelectDate, onScheduleLoaded, selectedDate });
  useEffect(() => {
    callbacksRef.current = { onSelectDate, onScheduleLoaded, selectedDate };
  });

  useEffect(() => {
    let active = true;
    const todayStr = getTodayStr();

    async function loadMonth() {
      try {
        const res = await fetch(`/api/schedule?month=${monthStr}`);
        const json = await res.json();
        if (!active || !json.success) return;

        setDaysMap(json.days || {});
        setLoadedKey(currentKey);

        const cbs = callbacksRef.current;
        if (cbs.onScheduleLoaded) {
          cbs.onScheduleLoaded(json.days || {}, {
            workingDays: json.workingDays,
            defaultSlots: json.defaultSlots,
          });
        }
        if (!allowPastOrOff && !cbs.selectedDate) {
          const firstAvailable = Object.keys(json.days || {})
            .sort()
            .find((d) => d >= todayStr && !json.days[d].isDayOff && json.days[d].availableSlots.length > 0);
          if (firstAvailable && cbs.onSelectDate) {
            cbs.onSelectDate(firstAvailable, json.days[firstAvailable]);
          }
        }
      } catch (err) {
        console.error('Failed to load month schedule:', err);
        if (active) setLoadedKey(currentKey);
      }
    }

    loadMonth();
    return () => {
      active = false;
    };
  }, [monthStr, currentKey, allowPastOrOff]);

  const prevMonth = () => {
    if (!allowPastOrOff && monthStr <= minMonthStr) return;
    if (viewMonth === 1) {
      setViewYear((y) => y - 1);
      setViewMonth(12);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 12) {
      setViewYear((y) => y + 1);
      setViewMonth(1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const todayStr = getTodayStr();
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const firstDayJs = new Date(viewYear, viewMonth - 1, 1).getDay();
  const startOffset = (firstDayJs + 6) % 7;

  const cells = [];
  for (let i = 0; i < startOffset; i++) {
    cells.push({ empty: true, key: `empty-${i}` });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const info = daysMap[dateStr];
    const isPast = dateStr < todayStr;
    const isOff = info ? info.isDayOff : false;
    const availCount = info ? info.availableSlots.length : 0;
    const isDisabled = !allowPastOrOff && (isPast || isOff || availCount === 0);

    cells.push({
      empty: false,
      key: dateStr,
      day,
      dateStr,
      info,
      isPast,
      isOff,
      availCount,
      isDisabled,
      isToday: dateStr === todayStr,
      isSelected: dateStr === selectedDate,
      hasOverride: info ? (info.blockedSlots?.length > 0 || info.extraSlots?.length > 0 || Boolean(info.note)) : false,
    });
  }

  return (
    <div className="mc-calendar">
      <div className="mc-header">
        <button
          type="button"
          className="mc-nav-btn"
          onClick={prevMonth}
          disabled={!allowPastOrOff && monthStr <= minMonthStr}
          aria-label="Попередній місяць"
        >
          ‹
        </button>
        <div className="mc-month-title">
          {MONTH_NAMES_UK[viewMonth - 1]} {viewYear}
        </div>
        <button
          type="button"
          className="mc-nav-btn"
          onClick={nextMonth}
          aria-label="Наступний місяць"
        >
          ›
        </button>
      </div>

      <div className="mc-weekdays">
        {WEEKDAYS_UK.map((w) => (
          <div key={w} className="mc-weekday">
            {w}
          </div>
        ))}
      </div>

      <div className={`mc-grid ${loading ? 'mc-loading' : ''}`}>
        {cells.map((cell) => {
          if (cell.empty) {
            return <div key={cell.key} className="mc-cell mc-empty" />;
          }

          const classes = ['mc-cell', 'mc-day'];
          if (cell.isSelected) classes.push('mc-selected');
          if (cell.isToday) classes.push('mc-today');
          if (cell.isDisabled) classes.push('mc-disabled');
          if (cell.isOff) classes.push('mc-dayoff');
          if (cell.availCount > 0 && !cell.isPast) classes.push('mc-available');
          if (allowPastOrOff && cell.hasOverride) classes.push('mc-override');

          return (
            <button
              key={cell.key}
              type="button"
              disabled={cell.isDisabled}
              className={classes.join(' ')}
              onClick={() => onSelectDate && onSelectDate(cell.dateStr, cell.info)}
              title={
                cell.isOff
                  ? 'Вихідний день'
                  : cell.availCount > 0
                  ? `Вільних годин: ${cell.availCount}`
                  : 'Немає вільних годин'
              }
            >
              <span className="mc-day-num">{cell.day}</span>
              {!cell.isPast && !cell.isOff && cell.availCount > 0 && (
                <span className="mc-dot" aria-hidden="true" />
              )}
              {allowPastOrOff && cell.isOff && <span className="mc-off-tag">вих</span>}
            </button>
          );
        })}
      </div>

      <div className="mc-legend">
        <span><i className="mc-legend-dot available" /> Є вільний час</span>
        <span><i className="mc-legend-dot selected" /> Обраний день</span>
        <span><i className="mc-legend-dot off" /> Вихідний / зайнято</span>
      </div>
    </div>
  );
}
