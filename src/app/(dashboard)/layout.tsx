import Sidebar from "@/components/sidebar/Sidebar"
import ConversationList from "@/components/sidebar/ConversationList"
import SettingsModal from "@/components/sidebar/SettingsModal"
import PusherConnectionIndicator from "@/components/PusherConnectionIndicator"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-full">
      <PusherConnectionIndicator />
      <SettingsModal />
      <Sidebar />
      <ConversationList />
      <main id="main-content" className="lg:ml-20 lg:pl-80 h-full pb-20 lg:pb-0 [padding-bottom:max(5rem,env(safe-area-inset-bottom))] lg:[padding-bottom:0]">
        {children}
      </main>
    </div>
  )
}
