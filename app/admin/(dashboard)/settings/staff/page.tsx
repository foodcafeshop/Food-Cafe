"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Trash2, User } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useShopId } from "@/lib/hooks/use-shop-id";

export default function StaffPage() {
    const [staff, setStaff] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newStaff, setNewStaff] = useState({ name: '', username: '', password: '' });
    const [creating, setCreating] = useState(false);
    const [shopSlug, setShopSlug] = useState<string | null>(null);
    const { shopId } = useShopId();

    useEffect(() => {
        fetchStaff();
    }, []);

    useEffect(() => {
        if (shopId) {
            const fetchShopSlug = async () => {
                const { data } = await supabase
                    .from('shops')
                    .select('slug')
                    .eq('id', shopId)
                    .single();
                if (data) {
                    setShopSlug(data.slug);
                }
            };
            fetchShopSlug();
        }
    }, [shopId]);

    const fetchStaff = async () => {
        try {
            const res = await fetch('/api/admin/staff');
            if (!res.ok) throw new Error('Failed to fetch staff');
            const data = await res.json();
            setStaff(data);
        } catch (error) {
            console.error(error);
            // toast.error("Could not load staff list");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            const res = await fetch('/api/admin/staff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newStaff)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create staff');

            toast.success("Staff member created successfully");
            setIsDialogOpen(false);
            setNewStaff({ name: '', username: '', password: '' });
            fetchStaff();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto pb-24">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Staff Management</h1>
                    <p className="text-muted-foreground">Manage access for your team members.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" /> Add Staff
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Staff Member</DialogTitle>
                            <DialogDescription>
                                Create an account for your staff. They can use these credentials to log in.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateStaff} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    value={newStaff.name}
                                    onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="username">Username</Label>
                                <div className="flex items-center border rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:border-primary bg-background">
                                    <Input
                                        id="username"
                                        value={newStaff.username}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            // Only allow alphanumeric, -, _, .
                                            if (/^[a-zA-Z0-9._-]*$/.test(val)) {
                                                setNewStaff({ ...newStaff, username: val });
                                            }
                                        }}
                                        required
                                        placeholder="john"
                                        className="border-0 focus-visible:ring-0 rounded-r-none"
                                    />
                                    <span className="px-3 text-muted-foreground bg-muted/50 border-l h-10 flex items-center rounded-r-md text-sm whitespace-nowrap">
                                        @{shopSlug || 'shop-slug'}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Only letters, numbers, dots, dashes, and underscores allowed.
                                </p>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={newStaff.password}
                                    onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                                    required
                                    minLength={6}
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={creating}>
                                    {creating ? "Creating..." : "Create Account"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>List of all active staff accounts.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">Loading...</TableCell>
                                </TableRow>
                            ) : staff.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No staff members found. Add one to get started.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                staff.map((member) => (
                                    <TableRow key={member.id}>
                                        <TableCell className="font-medium flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                                <User className="h-4 w-4" />
                                            </div>
                                            {member.name || 'Unknown'}
                                        </TableCell>
                                        <TableCell>{member.email}</TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                                                {member.role}
                                            </span>
                                        </TableCell>
                                        <TableCell>{new Date(member.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
