import { useEffect, useRef, useCallback } from "react";
import api from "../utils/api";

export function useMedicationReminders(medications, onDoseReminder) {
  const lastReminderRef = useRef({});
  const audioContextRef = useRef(null);

  const playReminderAlarm = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = ctx;

      // Melodic reminder pattern (different from critical alarm)
      const notes = [
        { freq: 523, duration: 0.2 }, // C
        { freq: 659, duration: 0.2 }, // E
        { freq: 784, duration: 0.3 }, // G
      ];

      let time = ctx.currentTime;
      notes.forEach((note) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = note.freq;
        osc.type = "sine";

        gain.gain.setValueAtTime(0.25, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + note.duration);

        osc.start(time);
        osc.stop(time + note.duration + 0.05);

        time += note.duration + 0.1;
      });
    } catch (err) {
      console.error("Audio playback error:", err);
    }
  }, []);

  const checkMedicationTimes = useCallback(async () => {
    if (!medications || medications.length === 0) return;

    const now = new Date();

    medications.forEach((med) => {
      if (!med.next_dose_time) return;

      const nextDose = new Date(med.next_dose_time);
      const minUntilDose = (nextDose - now) / 60000; // minutes
      const reminderId = `${med.id}-${nextDose.getTime()}`;

      // Remind when within 5 minutes and haven't reminded yet
      if (
        minUntilDose <= 5 &&
        minUntilDose > 0 &&
        !lastReminderRef.current[reminderId]
      ) {
        lastReminderRef.current[reminderId] = true;
        playReminderAlarm();

        // Browser notification
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("💊 Medication Reminder", {
            body: `Time to take ${med.name} (${med.dose_amount}${med.dose_unit}) in ${Math.ceil(minUntilDose)} minutes`,
            requireInteraction: false,
            tag: `med-reminder-${med.id}`,
          });
        }

        onDoseReminder?.(med);
      }

      // Alert when overdue
      if (minUntilDose < 0) {
        const minOverdue = Math.floor(-minUntilDose);
        const overdueId = `${med.id}-overdue`;

        if (!lastReminderRef.current[overdueId] && minOverdue < 60) {
          lastReminderRef.current[overdueId] = true;
          playReminderAlarm();

          if (
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            new Notification("⏰ Dose Overdue", {
              body: `${med.name} was due ${minOverdue} minutes ago. Please take it now.`,
              requireInteraction: true,
              tag: `overdue-${med.id}`,
            });
          }

          onDoseReminder?.(med);
        }
      }

      // Reset reminder flags when dose time has passed (more than 1 hour)
      if (minUntilDose < -60) {
        delete lastReminderRef.current[reminderId];
      }
    });
  }, [medications, onDoseReminder, playReminderAlarm]);

  useEffect(() => {
    checkMedicationTimes();
    const interval = setInterval(checkMedicationTimes, 60000); // Check every minute

    return () => {
      clearInterval(interval);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [checkMedicationTimes]);
}
