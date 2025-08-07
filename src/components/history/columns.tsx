"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { Bet } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "./data-table-column-header"
import { DataTableRowActions } from "./data-table-row-actions"
import { format } from 'date-fns'

interface ColumnsProps {
  updateBetStatus: (betId: string, newStatus: 'Ganada' | 'Perdida') => void;
}

export const columns = ({ updateBetStatus }: ColumnsProps): ColumnDef<Bet>[] => [
  {
    accessorKey: "match",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Partido / Selección" />,
    cell: ({ row }) => {
      return (
        <div className="flex flex-col">
          <span className="font-medium max-w-[300px] truncate">{row.original.match}</span>
          <span className="text-muted-foreground text-sm">{row.original.selection} ({row.original.market})</span>
        </div>
      )
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
    cell: ({ row }) => {
      const status = row.original.status
      const className = 
        status === 'Ganada' ? 'bg-green-900/50 text-green-400 border-green-700/30 hover:bg-green-900/70' :
        status === 'Perdida' ? 'bg-red-900/50 text-red-400 border-red-700/30 hover:bg-red-900/70' :
        status === 'Pendiente' ? 'bg-yellow-900/50 text-yellow-400 border-yellow-700/30 hover:bg-yellow-900/70' : 
        'bg-gray-700/50 text-gray-400 border-gray-600/30';

      return <Badge variant="outline" className={`capitalize ${className}`}>{status}</Badge>
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
    {
    accessorKey: "valueCalculated",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Valor" />,
    cell: ({ row }) => {
        const value = row.original.valueCalculated;
        const color = value > 0 ? 'text-green-400' : 'text-red-400';
        return <span className={color}>{value > 0 ? `+${(value * 100).toFixed(1)}%` : `${(value * 100).toFixed(1)}%`}</span>
    },
  },
  {
    accessorKey: "stake",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Stake" />,
    cell: ({ row }) => `$${row.original.stake.toFixed(2)}`,
  },
  {
    accessorKey: "odds",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Cuota" />,
    cell: ({ row }) => row.original.odds.toFixed(2),
  },
  {
    accessorKey: "profitOrLoss",
    header: ({ column }) => <DataTableColumnHeader column={column} title="P/L" />,
    cell: ({ row }) => {
      const profit = row.original.profitOrLoss
      if(row.original.status === 'Pendiente') return <span className="text-muted-foreground">-</span>
      const color = profit > 0 ? 'text-green-400' : profit < 0 ? 'text-red-400' : 'text-muted-foreground'
      return <span className={`font-medium ${color}`}>{profit >= 0 ? `+$${profit.toFixed(2)}` : `-$${Math.abs(profit).toFixed(2)}`}</span>
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" />,
    cell: ({ row }) => {
        const date = row.original.createdAt;
        // Check if date is a valid Date object before formatting
        if (date instanceof Date && !isNaN(date.getTime())) {
            return format(date, 'dd/MM/yyyy HH:mm');
        }
        return "Fecha inválida";
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} updateBetStatus={updateBetStatus} />,
  },
]
