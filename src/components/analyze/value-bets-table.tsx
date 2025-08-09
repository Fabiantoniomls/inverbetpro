
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


function ParticipantOddsButton({ participant, matchInfo }: { participant: Pick, matchInfo: MatchAnalysis }) {
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
            className={cn("w-24", isSelected && "border-primary")}
        >
            {!isSelected && <PlusCircle className="mr-2 h-4 w-4"/>}
            {participant.odds.toFixed(2)}
        </Button>
    )
}


export function ValueBetsTable({ data }: { data: MatchAnalysis[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([
     {
      id: "value", // A placeholder, we'll sort manually if needed
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
      id: "participantA",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Participante A" />,
      cell: ({ row }) => {
        const { participantA, ...matchInfo } = row.original;
        return (
            <div className="flex items-center justify-between">
                <span>{participantA.name}</span>
                <ParticipantOddsButton participant={participantA} matchInfo={matchInfo} />
            </div>
        )
      },
    },
    {
      id: "participantB",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Participante B" />,
      cell: ({ row }) => {
         const { participantB, ...matchInfo } = row.original;
        return (
            <div className="flex items-center justify-between">
                <span>{participantB.name}</span>
                <ParticipantOddsButton participant={participantB} matchInfo={matchInfo} />
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
