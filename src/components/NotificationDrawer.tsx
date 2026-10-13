import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, AlertTriangle, Bot, Clock, Shield, Monitor, CheckCheck } from "lucide-react";
import { Badge, Button, Modal, BottomSheet, FilterPills } from "@/components/ui";
import {
  mockNotifications,
  type Notification,
  type NotificationType,
} from "@/modules/dashboard/data/mockNotifications";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { cn, formatDate } from "@/lib/utils";

const typeConfig: Record<NotificationType, { icon: React.ElementType; color: string }> = {
  "agent-action": { icon: Bot, color: "text-primary" },
  escalation: { icon: AlertTriangle, color: "text-error" },
  "sla-breach": { icon: Clock, color: "text-warning" },
  "approval-request": { icon: Shield, color: "text-primary" },
  system: { icon: Monitor, color: "text-gray-500" },
};

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [readState, setReadState] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(mockNotifications.map((n) => [n.id, n.read])),
  );
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadCount = Object.values(readState).filter((r) => !r).length;

  const markAllRead = () => {
    setReadState((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        next[key] = true;
      }
      return next;
    });
  };

  const handleNotificationClick = (notification: Notification) => {
    setReadState((prev) => ({ ...prev, [notification.id]: true }));
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      onClose();
    }
  };

  const formatTime = (timestamp: string) => {
    const d = new Date(timestamp);
    return d.toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const content = (
    <>
      {/* eslint-disable-next-line design-system/prefer-section-header -- custom header inside Modal/BottomSheet with conditional actions */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-gray-500" />
          {unreadCount > 0 && (
            <Badge variant="error" size="sm">
              {unreadCount} unread
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={markAllRead}>
            <CheckCheck className="w-3 h-3" />
            Mark all read
          </Button>
        )}
      </div>

      <FilterPills
        value={filter}
        onChange={(v) => setFilter(v as "all" | "unread")}
        options={[
          { value: "all", label: "All" },
          { value: "unread", label: "Unread" },
        ]}
        className="mb-3"
      />

      <div className={cn("space-y-1 overflow-y-auto -mx-1 px-1", !isMobile && "max-h-[60vh]")}>
        {mockNotifications
          .filter((n) => {
            if (filter === "unread") return !readState[n.id];
            return true;
          })
          .map((notification) => {
            const config = typeConfig[notification.type];
            const Icon = config.icon;
            const isRead = readState[notification.id];

            return (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={cn(
                  "w-full text-left p-3 rounded-lg transition-colors duration-150 hover:bg-gray-50",
                  !isRead && "bg-primary-50/30 border border-primary/10",
                  isRead && "border border-transparent",
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("mt-0.5 shrink-0", config.color)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p
                        className={cn(
                          "text-sm truncate",
                          !isRead ? "font-semibold text-gray-900" : "font-medium text-gray-700",
                        )}
                      >
                        {notification.title}
                      </p>
                      {!isRead && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{notification.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(new Date(notification.timestamp))} at {formatTime(notification.timestamp)}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
      </div>
    </>
  );

  if (isMobile) {
    return (
      <BottomSheet isOpen={isOpen} onClose={onClose} title="Notifications">
        {content}
      </BottomSheet>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Notifications">
      {content}
    </Modal>
  );
}
