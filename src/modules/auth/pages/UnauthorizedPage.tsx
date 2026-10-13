import { useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Button, EmptyState } from "@/components/ui";

export function UnauthorizedPage(): React.ReactNode {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white shadow-sm">
        <EmptyState
          icon={ShieldAlert}
          iconClassName="text-amber-600"
          title="Access denied"
          description="You do not have permission to view this resource. If you believe this is a mistake, contact your administrator."
          action={
            <Button type="button" onClick={() => navigate("/home")}>
              Return to console home
            </Button>
          }
          className="py-12"
        />
      </div>
    </div>
  );
}
