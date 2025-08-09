"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export interface Market {
  match: string
  market: string
  selection: string
  odds1: number
  odds2: number
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
    accessorKey: "market",
    header: "Mercado",
    cell: ({ row }) => (
       <div className="max-w-[200px] truncate">{row.getValue("market")}</div>
    ),
  },
  {
    accessorKey: "selection",
    header: "Selección",
    cell: ({ row }) => <div>{row.getValue("selection")}</div>,
  },
  {
    accessorKey: "odds1",
    header: () => <div className="text-right">Cuota</div>,
    cell: ({ row }) => {
      const odds1 = parseFloat(row.getValue("odds1"))
      const formatted = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(odds1)

      return <div className="text-right font-medium">{formatted}</div>
    },
  },
]

interface FeaturedMarketsTableProps {
  data: Market[]
}

export function FeaturedMarketsTable({ data }: FeaturedMarketsTableProps) {
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
