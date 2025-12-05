
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingBag, Users, Clock, Calendar as CalendarIcon } from "lucide-react";
import { getSettings, getDashboardStats, getPeakHoursStats } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn, getCurrencySymbol } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
    const [currencySymbol, setCurrencySymbol] = useState("$");
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('week');
    const [customDate, setCustomDate] = useState<DateRange | undefined>();
    const [chartMetric, setChartMetric] = useState<'revenue' | 'net' | 'tax' | 'service'>('revenue');
    const [categoryMetric, setCategoryMetric] = useState<'sales' | 'count'>('sales');

    const [shopId, setShopId] = useState<string | null>(null);

    useEffect(() => {
        const fetchShopId = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: roleData } = await supabase
                    .from('user_roles')
                    .select('shop_id')
                    .eq('id', user.id)
                    .single();
                if (roleData) {
                    setShopId(roleData.shop_id);
                }
            }
        };
        fetchShopId();
    }, []);

    useEffect(() => {
        if (!shopId) return;

        const fetchData = async () => {
            setLoading(true);
            let customRangeArg;
            if (dateRange === 'custom' && customDate?.from) {
                customRangeArg = { from: customDate.from, to: customDate.to || customDate.from };
            }

            const [settings, dashboardStats, peakHours] = await Promise.all([
                getSettings(shopId),
                getDashboardStats(shopId, dateRange, customRangeArg),
                getPeakHoursStats(shopId)
            ]);

            if (settings?.currency) {
                setCurrencySymbol(getCurrencySymbol(settings.currency));
            }
            if (dashboardStats) {
                setStats({ ...dashboardStats, peakHours });
            }
            setLoading(false);
        };
        fetchData();
    }, [dateRange, customDate, shopId]);

    if (loading && !stats) {
        return <div className="p-8 text-center text-muted-foreground">Loading dashboard...</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <Select value={dateRange} onValueChange={(val: any) => setDateRange(val)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="week">Last 7 Days</SelectItem>
                            <SelectItem value="month">Last 30 Days</SelectItem>
                            <SelectItem value="year">Last Year</SelectItem>
                            <SelectItem value="custom">Custom Range</SelectItem>
                        </SelectContent>
                    </Select>

                    {dateRange === 'custom' && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn(
                                        "w-[300px] justify-start text-left font-normal",
                                        !customDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {customDate?.from ? (
                                        customDate.to ? (
                                            <>
                                                {format(customDate.from, "LLL dd, y")} -{" "}
                                                {format(customDate.to, "LLL dd, y")}
                                            </>
                                        ) : (
                                            format(customDate.from, "LLL dd, y")
                                        )
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={customDate?.from}
                                    selected={customDate}
                                    onSelect={setCustomDate}
                                    numberOfMonths={2}
                                    disabled={{ after: new Date() }}
                                    toMonth={new Date()}
                                />
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{currencySymbol}{stats?.totalRevenue?.toFixed(2) || '0.00'}</div>
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                            <div className="flex flex-col">
                                <span className="font-semibold text-foreground">{currencySymbol}{stats?.netSales?.toFixed(2) || '0.00'}</span>
                                <span>Net</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-semibold text-foreground">{currencySymbol}{stats?.totalTax?.toFixed(2) || '0.00'}</span>
                                <span>Tax</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-semibold text-foreground">{currencySymbol}{stats?.totalServiceCharge?.toFixed(2) || '0.00'}</span>
                                <span>Service</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.activeOrdersCount || 0}</div>
                        <p className="text-xs text-muted-foreground">Queued or preparing</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Tables</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.occupiedTablesCount || 0}/{stats?.totalTablesCount || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats?.totalTablesCount ? Math.round((stats.occupiedTablesCount / stats.totalTablesCount) * 100) : 0}% occupancy
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">System Status</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">Online</div>
                        <p className="text-xs text-muted-foreground">All systems operational</p>
                    </CardContent>
                </Card>
            </div>



            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Sales</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {stats?.recentSales?.length === 0 ? (
                                <div className="text-center text-muted-foreground">No recent sales</div>
                            ) : (
                                stats?.recentSales?.map((sale: any) => (
                                    <div key={sale.id} className="flex items-center">
                                        <div className="ml-4 space-y-1">
                                            <p className="text-sm font-medium leading-none">{sale.tables?.label || 'Unknown Table'}</p>
                                            <p className="text-sm text-muted-foreground">Bill #{sale.id.slice(0, 8)}</p>
                                        </div>
                                        <div className="ml-auto font-medium">+{currencySymbol}{sale.total_amount.toFixed(2)}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Popular Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {stats?.popularItems?.length === 0 ? (
                                <div className="text-center text-muted-foreground">No data available</div>
                            ) : (
                                stats?.popularItems?.map((item: any, i: number) => (
                                    <div key={i} className="flex items-center">
                                        <div className="ml-4 space-y-1">
                                            <p className="text-sm font-medium leading-none">{item.name}</p>
                                            <p className="text-sm text-muted-foreground">{item.count} orders</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Revenue Overview ({dateRange === 'custom' ? 'Custom Range' : dateRange === 'today' ? 'Today' : dateRange === 'week' ? 'Last 7 Days' : dateRange === 'month' ? 'Last 30 Days' : 'Last Year'})</CardTitle>
                        <Select value={chartMetric} onValueChange={(val: any) => setChartMetric(val)}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Metric" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="revenue">Total Revenue</SelectItem>
                                <SelectItem value="net">Net Sales</SelectItem>
                                <SelectItem value="tax">Tax Collected</SelectItem>
                                <SelectItem value="service">Service Charge</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[200px] w-full">
                            {stats?.revenueChartData && (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats.revenueChartData}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${currencySymbol}${value.toFixed(2)} `} />
                                        <Tooltip formatter={(value: number) => [`${currencySymbol}${value.toFixed(2)}`, chartMetric === 'revenue' ? 'Revenue' : chartMetric === 'net' ? 'Net Sales' : chartMetric === 'tax' ? 'Tax' : 'Service Charge']} />
                                        <Area type="monotone" dataKey={chartMetric} stroke="#8884d8" fillOpacity={1} fill="url(#colorRevenue)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Category Breakdown</CardTitle>
                        <Select value={categoryMetric} onValueChange={(val: any) => setCategoryMetric(val)}>
                            <SelectTrigger className="w-[110px] h-8 text-xs">
                                <SelectValue placeholder="Metric" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="sales">By Sales</SelectItem>
                                <SelectItem value="count">By Count</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px] w-full">
                            {stats?.categoryChartData && (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={stats.categoryChartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            paddingAngle={5}
                                            dataKey={categoryMetric}
                                        >
                                            {stats.categoryChartData.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'][index % 5]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => [
                                            categoryMetric === 'sales' ? `${currencySymbol}${value.toFixed(2)}` : value,
                                            categoryMetric === 'sales' ? "Sales" : "Items"
                                        ]} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Peak Hours Chart */}
            <div className="grid gap-4 md:grid-cols-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Peak Hours (Last 30 Days)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            {stats?.peakHours && (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.peakHours}>
                                        <XAxis dataKey="hour" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip cursor={{ fill: 'transparent' }} />
                                        <Bar dataKey="count" fill="#adfa1d" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
