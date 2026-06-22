import Page from "../components/ui/Page";
import AccountCard from "./settings/AccountCard";
import AlarmCard from "./settings/AlarmCard";
import AppearanceCard from "./settings/AppearanceCard";
import MusicCard from "./settings/MusicCard";
import SecurityKeysCard from "./settings/SecurityKeysCard";

export default function Settings() {
  return (
    <Page title="Settings" testId="settings">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AppearanceCard />
        <AlarmCard />
        <MusicCard />
        <AccountCard />
        <SecurityKeysCard />
      </div>
    </Page>
  );
}
