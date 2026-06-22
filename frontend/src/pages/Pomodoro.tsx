import { useState } from "react";
import Notice from "../components/ui/Notice";
import Page from "../components/ui/Page";
import { usePomodoro } from "../context/PomodoroContext";
import SessionHistory from "./pomodoro/SessionHistory";
import TaskPickerModal from "./pomodoro/TaskPickerModal";
import TimerCard from "./pomodoro/TimerCard";

export default function Pomodoro() {
  const { connected, setTask } = usePomodoro();
  const [showPicker, setShowPicker] = useState(false);

  return (
    <Page title="Pomodoro Timer" testId="pomodoro">
      {!connected && (
        <Notice className="mb-4">
          Google Calendar isn't connected, so sessions won't be tagged with a task. Run{" "}
          <code>python manage.py authorize_google</code> on the server.
        </Notice>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
        <TimerCard onChooseTask={() => setShowPicker(true)} />
        <SessionHistory />
      </div>

      {showPicker && (
        <TaskPickerModal
          onClose={() => setShowPicker(false)}
          onPick={(picked) => {
            setTask(picked);
            setShowPicker(false);
          }}
          onClear={() => {
            setTask({ event_id: null, summary: null });
            setShowPicker(false);
          }}
        />
      )}
    </Page>
  );
}
