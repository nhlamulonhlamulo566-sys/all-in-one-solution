import ChatDashboard from '@/components/chat-dashboard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { MessagesSquare } from 'lucide-react';
import PrivateRoute from '@/components/private-route';

export default function AdminChatPage() {
  return (
    <PrivateRoute>
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <MessagesSquare className="w-6 h-6 text-primary" />
              Agent Chat Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              View and respond to live chat sessions from your website visitors.
              Select a session from the list to start a conversation.
            </p>
            <ChatDashboard />
          </CardContent>
        </Card>
      </div>
    </PrivateRoute>
  );
}

export const metadata = {
  title: 'Agent Chat Dashboard | All In One Solution',
  description: 'Manage live chat sessions with customers.',
};
