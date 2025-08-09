
"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { PlusCircle } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { useBetSlip } from "@/hooks/use-bet-slip"
import type { Pick } from "@/lib/types/analysis"
import { cn } from "@/lib/utils"
import { Button } from "../ui/button"

export interface Market {
  match: string
  selection1: string
  selection2: string
  odds1: number
  odds2: number
}

function AddToSlipButton({ selection, odds, match }: { selection: string, odds: number, match: string }) {
    const { addPick, picks: selectedPicks } = useBetSlip();
    
    const pickForBetSlip: Pick = {
        id: '', // Hook will generate ID
        sport: 'Tenis',
        match: match,
        market: 'Ganador del Partido',
        selection: selection,
        odds: odds,
    };

    const isSelected = selectedPicks.some(p => 
        p.match === pickForBetSlip.match && p.selection === pickForBetSlip.selection
    );

    return (
        <Button 
            variant={isSelected ? "secondary" : "outline"} 
            size="sm" 
            onClick={() => addPick(pickForBetSlip)}
            className={cn("w-full justify-between items-center", isSelected && "border-primary")}
        >
            <span>{selection}</span>
            <div className="flex items-center gap-2">
                 {!isSelected && <PlusCircle className="h-4 w-4 text-muted-foreground"/>}
                <span className="font-semibold">{odds.toFixed(2)}</span>
            </div>
        </Button>
    )
}


export const columns: ColumnDef<Market>[] = [
  {
    accessorKey: "match",
    header: "Partido",
    cell: ({ row }) => (
      <div className="font-medium max-w-[250px] truncate">{row.getValue("match")}</div>
    ),
  },
  {
    id: 'player1',
    header: "Jugador 1",
    cell: ({ row }) => {
      const market = row.original;
      return <AddToSlipButton selection={market.selection1} odds={market.odds1} match={market.match} />
    },
  },
  {
    id: 'player2',
    header: "Jugador 2",
    cell: ({ row }) => {
       const market = row.original;
       return <AddToSlipButton selection={market.selection2} odds={market.odds2} match={market.match} />
    },
  },
]

interface FeaturedMatchesTableProps {
  data: Market[]
}

export function FeaturedMatchesTable({ data }: FeaturedMatchesTableProps) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
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
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No hay resultados.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
