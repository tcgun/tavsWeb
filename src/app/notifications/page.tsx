"use client";

import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import RightSidebar from "@/components/layout/RightSidebar";
import { Heart, MessageCircle, UserPlus } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

export default function NotificationsPage() {
    const { notifications, loading } = useNotifications();

    const getIcon = (type: string) => {
        switch (type) {
            case "like": return <Heart className="h-5 w-5 text-red-500" />;
            case "comment": return <MessageCircle className="h-5 w-5 text-blue-500" />;
            case "follow": return <UserPlus className="h-5 w-5 text-[var(--color-primary)]" />;
            default: return null;
        }
    };

    const getNotificationText = (type: string) => {
        switch (type) {
            case "like": return "tavsiyeni beğendi.";
            case "comment": return "tavsiyene yorum yaptı.";
            case "follow": return "seni takip etmeye başladı.";
            default: return "bir işlem yaptı.";
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-background)]">
            <Header />
            <div className="container mx-auto px-4 pt-6">
                <div className="flex gap-6">
                    <Sidebar />

                    <main className="flex-1 max-w-2xl mx-auto">

                        <div className="space-y-4">
                            {loading ? (
                                <p className="text-[var(--color-muted)]">Yükleniyor...</p>
                            ) : notifications.length > 0 ? (
                                notifications.map((notif) => (
                                    <div key={notif.id} className={`bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4 flex items-center gap-4 hover:bg-[var(--color-background)] transition-colors ${!notif.read ? 'bg-opacity-50 border-l-4 border-l-[var(--color-primary)]' : ''}`}>
                                        <div className="p-2 bg-[var(--color-background)] rounded-full border border-[var(--color-border)]">
                                            {getIcon(notif.type)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[var(--color-text)]">
                                                <span className="font-bold">{notif.sourceName}</span> {getNotificationText(notif.type)}
                                            </p>
                                            <span className="text-xs text-[var(--color-muted)]">
                                                {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: tr })}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-[var(--color-muted)]">Henüz bildiriminiz yok.</p>
                            )}
                        </div>
                    </main>

                    <RightSidebar />
                </div>
            </div>
        </div>
    );
}
