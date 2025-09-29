import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Image, 
  MessageCircle, 
  Clock, 
  CheckCircle, 
  XCircle,
  Download
} from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage photos, memories, and moderate content
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Photos</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              +2 from last week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Memories</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground">
              +3 from last week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contributors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              Active contributors
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Review Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Photos
            </CardTitle>
            <CardDescription>
              Photos waiting for approval
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Placeholder pending photos */}
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded bg-muted" />
                  <div>
                    <p className="font-medium">Photo {i + 1}</p>
                    <p className="text-sm text-muted-foreground">
                      Uploaded 2 hours ago
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full">
              View All Pending Photos
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Pending Memories
            </CardTitle>
            <CardDescription>
              Memories waiting for approval
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Placeholder pending memories */}
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="rounded-lg border p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-medium">Memory from Sarah M.</p>
                  <p className="text-sm text-muted-foreground">1 hour ago</p>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  "Rudy was such a kind person. I remember when he helped me..."
                </p>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full">
              View All Pending Memories
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common administrative tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export All Data
            </Button>
            <Button variant="outline">
              View All Photos
            </Button>
            <Button variant="outline">
              View All Memories
            </Button>
            <Button variant="outline">
              Manage Contributors
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
