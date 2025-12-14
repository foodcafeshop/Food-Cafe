"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, CheckSquare } from "lucide-react";
import { getTables } from "@/lib/api";
import { useShopId } from "@/lib/hooks/use-shop-id";
import { cn } from "@/lib/utils";

interface Table {
    id: string;
    label: string;
    status: 'empty' | 'occupied' | 'billed';
    seats: number;
    otp?: string;
}

interface TableSelectorProps {
    onSelect: (tableId: string, tableLabel: string) => void;
    onBill: (tableId: string) => void;
    onClear?: (tableId: string) => void;
    selectedTableId: string | null;
}

export function TableSelector({ onSelect, onBill, onClear, selectedTableId }: TableSelectorProps) {
    const { shopId } = useShopId();
    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (shopId) {
            loadTables();
        }
    }, [shopId]);

    const loadTables = async () => {
        try {
            setLoading(true);
            const data = await getTables(shopId!);
            setTables(data.sort((a: Table, b: Table) =>
                a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: 'base' })
            ));
        } catch (error) {
            console.error("Failed to load tables", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: Table['status']) => {
        switch (status) {
            case 'empty': return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
            case 'occupied': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
            case 'billed': return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
            default: return 'bg-gray-50 dark:bg-muted/50';
        }
    };

    if (loading) {
        return <div className="p-4 text-center text-muted-foreground">Loading tables...</div>;
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {tables.map((table) => (
                <Card
                    key={table.id}
                    className={cn(
                        "p-4 cursor-pointer hover:shadow-md transition-all border-2",
                        getStatusColor(table.status),
                        selectedTableId === table.id ? "ring-2 ring-primary border-primary" : ""
                    )}
                    onClick={() => onSelect(table.id, table.label)}
                >
                    <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-lg">{table.label}</span>
                        <div className="flex items-center gap-1 text-xs font-medium opacity-80">
                            <Users className="h-3 w-3" />
                            <span>{table.seats}</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-end">
                        <div className="flex flex-col gap-1">
                            <div className="text-xs uppercase tracking-wider font-semibold opacity-70">
                                {table.status}
                            </div>
                            {table.otp && (
                                <div className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded w-fit">
                                    OTP: {table.otp}
                                </div>
                            )}
                        </div>
                        {table.status === 'occupied' && (
                            <Button
                                size="sm"
                                variant="destructive"
                                className="h-7 px-2 text-xs"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onBill(table.id);
                                }}
                            >
                                Bill
                            </Button>
                        )}
                        {table.status === 'billed' && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 gap-1"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm(`Mark ${table.label} as Empty?`)) {
                                        onClear?.(table.id);
                                    }
                                }}
                            >
                                <CheckSquare className="h-3 w-3" /> Clear
                            </Button>
                        )}
                    </div>
                </Card>
            ))}
        </div>
    );
}
