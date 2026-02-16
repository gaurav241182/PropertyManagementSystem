import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";

export default function AdminReports() {
  const revenueData = [
    { name: "Jan", rooms: 4000, food: 2400 },
    { name: "Feb", rooms: 3000, food: 1398 },
    { name: "Mar", rooms: 2000, food: 9800 },
    { name: "Apr", rooms: 2780, food: 3908 },
    { name: "May", rooms: 1890, food: 4800 },
    { name: "Jun", rooms: 2390, food: 3800 },
  ];

  const expenseData = [
    { name: "Salaries", value: 400 },
    { name: "Grocery", value: 300 },
    { name: "Utilities", value: 300 },
    { name: "Maintenance", value: 200 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-serif text-primary">Financial Reports</h2>
            <p className="text-muted-foreground">Analyze revenue, expenses, and profit margins.</p>
          </div>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export for Auditor
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>Monthly revenue breakdown by Rooms vs F&B.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="rooms" fill="#8884d8" name="Room Sales" />
                    <Bar dataKey="food" fill="#82ca9d" name="F&B Sales" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Expense Distribution</CardTitle>
              <CardDescription>Where is the money going?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {expenseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profit & Loss Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="font-medium">Total Revenue</span>
                <span className="font-bold text-green-600">$45,231.89</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="font-medium">Total Expenses</span>
                <span className="font-bold text-red-600">$12,450.00</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="font-bold text-lg">Net Profit</span>
                <span className="font-bold text-lg text-primary">$32,781.89</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}