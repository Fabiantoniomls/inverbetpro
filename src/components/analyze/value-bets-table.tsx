
"use client"

import * as React from "react"
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Settings2, PlusCircle } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type { Pick } from "@/lib/types/analysis"
import { DataTableColumnHeader } from "../history/data-table-column-header"
import { Button } from "../ui/button"
import { useBetSlip } from "@/hooks/use-bet-slip"
import { cn } from "@/lib/utils"


export function ValueBetsTable({ data }: { data: Pick[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([
     {
      id: "valueCalculated",
      desc: true,
    },
  ])
  const { addPick, picks: selectedPicks } = useBetSlip();

  const isPickSelected = (pick: Pick) => selectedPicks.some(p => p.id === pick.id);

  const columns: ColumnDef<Pick>[] = [
    {
      accessorKey: "match",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Partido" />,
      cell: ({ row }) => {
        return (
          <div className="flex flex-col">
            <span className="font-medium max-w-[300px] truncate">{row.original.match}</span>
             <span className="text-sm text-muted-foreground">{row.original.selection}</span>
          </div>
        )
      },
      enableSorting: false,
    },
    {
      accessorKey: "odds",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Cuota" />,
      cell: ({ row }) => {
        const pick = row.original;
        const isSelected = isPickSelected(pick);
        return (
           <Button 
                variant={isSelected ? "secondary" : "outline"} 
                size="sm" 
                onClick={() => addPick(pick)}
                className={cn("w-24", isSelected && "border-primary")}
            >
                {!isSelected && <PlusCircle className="mr-2 h-4 w-4"/>}
                {pick.odds.toFixed(2)}
            </Button>
        )
      },
    },
     {
      accessorKey: "estimatedProbability",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Prob. Estimada (%)" />,
      cell: ({ row }) => {
          const value = row.original.estimatedProbability;
          if (value === undefined) return '-';
          return <span>{value.toFixed(1)}%</span>
      },
    },
      {
      accessorKey: "valueCalculated",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Valor Calculado (%)" />,
      cell: ({ row }) => {
          const value = row.original.valueCalculated;
          if (value === undefined) return '-';
          const color = value > 0 ? 'text-green-400' : 'text-red-400';
          return <span className={`font-bold ${color}`}>{value > 0 ? `+${(value * 100).toFixed(1)}%` : `${(value * 100).toFixed(1)}%`}</span>
      },
    },
  ]

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(isPickSelected(row.original) && "bg-muted/50")}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No se encontraron apuestas de valor.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
