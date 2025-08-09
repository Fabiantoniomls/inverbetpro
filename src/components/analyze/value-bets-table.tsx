
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
import { PlusCircle } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type { Pick, MatchAnalysis } from "@/lib/types/analysis"
import { DataTableColumnHeader } from "../history/data-table-column-header"
import { Button } from "../ui/button"
import { useBetSlip } from "@/hooks/use-bet-slip"
import { cn } from "@/lib/utils"

// A simplified version of Pick for the button component
type Participant = {
    name: string;
    odds: number;
    estimatedProbability?: number;
    valueCalculated?: number;
}

function ParticipantOddsButton({ participant, matchInfo }: { participant: Participant, matchInfo: Omit<MatchAnalysis, 'participantA' | 'participantB'> }) {
    const { addPick, picks: selectedPicks } = useBetSlip();
    
    const pickForBetSlip: Pick = {
        id: '', // The hook will generate an ID
        sport: matchInfo.sport,
        match: matchInfo.matchTitle,
        market: matchInfo.market,
        selection: participant.name,
        odds: participant.odds,
        estimatedProbability: participant.estimatedProbability,
        valueCalculated: participant.valueCalculated,
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
            <span>{participant.name}</span>
            <div className="flex items-center gap-2">
                 {!isSelected && <PlusCircle className="h-4 w-4 text-muted-foreground"/>}
                <span className="font-semibold">{participant.odds.toFixed(2)}</span>
            </div>
        </Button>
    )
}


export function ValueBetsTable({ data }: { data: MatchAnalysis[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([
     {
      id: "valueCalculatedA", // Sort by a specific participant's value by default
      desc: true,
    },
  ])

  const columns: ColumnDef<MatchAnalysis>[] = [
    {
      accessorKey: "matchTitle",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Partido" />,
      cell: ({ row }) => {
        const match = row.original;
        return (
          <div className="flex flex-col">
            <span className="font-medium max-w-[300px] truncate">{match.matchTitle}</span>
            <span className="text-sm text-muted-foreground">{match.market}</span>
          </div>
        )
      },
      enableSorting: true,
    },
    {
      id: "estimatedProbability",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Prob. IA" />,
      cell: ({ row }) => {
        const match = row.original;
        return (
          <div className="space-y-2">
              <div className="text-xs">{match.participantA.name}: <span className="font-semibold">{match.participantA.estimatedProbability.toFixed(1)}%</span></div>
              <div className="text-xs">{match.participantB.name}: <span className="font-semibold">{match.participantB.estimatedProbability.toFixed(1)}%</span></div>
          </div>
        );
      },
    },
    {
      id: "valueCalculatedA", // Unique ID for sorting
      accessorFn: row => row.participantA.valueCalculated,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Valor (EV)" />,
      cell: ({ row }) => {
        const match = row.original;
        const valueA = match.participantA.valueCalculated;
        const valueB = match.participantB.valueCalculated;
        const colorA = valueA > 0 ? 'text-green-400' : 'text-red-400';
        const colorB = valueB > 0 ? 'text-green-400' : 'text-red-400';

        return (
            <div className="space-y-2">
                <div className={cn("text-xs font-medium", colorA)}>{(valueA * 100).toFixed(1)}%</div>
                <div className={cn("text-xs font-medium", colorB)}>{(valueB * 100).toFixed(1)}%</div>
            </div>
        )
      },
    },
    {
      id: "selection",
      header: "Selección y Cuota",
      cell: ({ row }) => {
        const match = row.original;
        const { participantA, participantB, ...restOfMatchInfo } = match;

        return (
            <div className="space-y-2 min-w-[200px]">
                <ParticipantOddsButton participant={participantA} matchInfo={restOfMatchInfo} />
                <ParticipantOddsButton participant={participantB} matchInfo={restOfMatchInfo} />
            </div>
        )
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
