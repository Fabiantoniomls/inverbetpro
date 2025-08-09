
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


function ParticipantOddsButton({ participant, matchInfo }: { participant: Pick, matchInfo: Omit<MatchAnalysis, 'participantA' | 'participantB'> }) {
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
            className={cn("w-full justify-start", isSelected && "border-primary")}
        >
            <div className="flex justify-between items-center w-full">
                <span>{participant.name}</span>
                <div className="flex items-center gap-2">
                     {!isSelected && <PlusCircle className="h-4 w-4"/>}
                    <span className="font-semibold">{participant.odds.toFixed(2)}</span>
                </div>
            </div>
        </Button>
    )
}


export function ValueBetsTable({ data }: { data: MatchAnalysis[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([
     {
      id: "valueCalculated",
      desc: true,
    },
  ])

  // We are transforming the data to create a row for each participant, not each match.
  const tableData = React.useMemo(() => {
    return data.flatMap(match => [
      { ...match.participantA, matchInfo: match },
      { ...match.participantB, matchInfo: match },
    ]);
  }, [data]);


  const columns: ColumnDef<typeof tableData[0]>[] = [
    {
      id: "match",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Partido" />,
      cell: ({ row }) => {
        const { matchInfo } = row.original;
        return (
          <div className="flex flex-col">
            <span className="font-medium max-w-[300px] truncate">{matchInfo.matchTitle}</span>
            <span className="text-sm text-muted-foreground">{matchInfo.market}</span>
          </div>
        )
      },
      enableSorting: true,
    },
    {
      id: "estimatedProbability",
      accessorKey: "estimatedProbability",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Prob. IA" />,
      cell: ({ row }) => {
        const prob = row.original.estimatedProbability;
        if (prob === undefined) return <span className="text-muted-foreground">-</span>;
        return <span>{prob.toFixed(1)}%</span>;
      },
       sortingFn: 'basic',
    },
     {
      id: "valueCalculated",
      accessorKey: "valueCalculated",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Valor (EV)" />,
      cell: ({ row }) => {
        const value = row.original.valueCalculated;
        if (value === undefined) return <span className="text-muted-foreground">-</span>;
        const color = value > 0 ? 'text-green-400' : 'text-red-400';
        return <span className={cn("font-medium", color)}>{(value * 100).toFixed(1)}%</span>
      },
      sortingFn: 'basic',
    },
    {
      id: "selection",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Selección y Cuota" />,
      cell: ({ row }) => {
        const participant = row.original;
        const { matchInfo } = participant;
        const { participantA, participantB, ...restOfMatchInfo } = matchInfo;
        return <ParticipantOddsButton participant={participant} matchInfo={restOfMatchInfo} />
      },
    },
  ]

  const table = useReactTable({
    data: tableData,
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
