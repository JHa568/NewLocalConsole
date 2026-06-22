import { useEffect, useState } from "react";
import Card from "../../components/ui/Card";
import SectionLabel from "../../components/ui/SectionLabel";
import Stepper from "../../components/ui/Stepper";
import { ALARMS, getAlarm, getStoredAlarmId, setStoredAlarmId } from "../../lib/alarms";

/** Pick and preview the Pomodoro completion alarm. */
export default function AlarmCard() {
  const [alarmId, setAlarmId] = useState(getStoredAlarmId);

  useEffect(() => {
    setStoredAlarmId(alarmId);
  }, [alarmId]);

  function cycleAlarm(dir: number) {
    const idx = ALARMS.findIndex((a) => a.id === alarmId);
    const next = ALARMS[(idx + dir + ALARMS.length) % ALARMS.length];
    setAlarmId(next.id);
    next.play(); // preview as you cycle
  }

  return (
    <Card>
      <SectionLabel>Timer alarm</SectionLabel>
      <p className="mt-1.5 mb-4 text-sm text-muted">
        Sound played when a Pomodoro finishes. Cycle to preview.
      </p>
      <div className="flex items-center gap-3">
        <Stepper
          label={getAlarm(alarmId).name}
          labelClassName="min-w-[140px]"
          prevAriaLabel="Previous alarm"
          nextAriaLabel="Next alarm"
          onPrev={() => cycleAlarm(-1)}
          onNext={() => cycleAlarm(1)}
        />
        <button className="ml-1" onClick={() => getAlarm(alarmId).play()}>
          Preview
        </button>
      </div>
    </Card>
  );
}
