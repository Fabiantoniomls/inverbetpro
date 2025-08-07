"use client"

import { MoreHorizontal, Check, X } from "lucide-react"
import type { Row } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Bet } from "@/lib/types"


interface DataTableRowActionsProps<TData> {
  row: Row<TData>
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const bet = row.original as Bet

  // Placeholder actions. In production, these would trigger server actions.
  const markAsWon = () => {
    console.log("Marking bet as won:", bet.id)
  }

  const markAsLost = () => {
    console.log("Marking bet as lost:", bet.id)
  }

  if (bet.status !== 'Pendiente') {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Abrir menú</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem onClick={markAsWon}>
          <Check className="mr-2 h-4 w-4 text-green-500"/>
          Marcar Ganada
        </DropdownMenuItem>
        <DropdownMenuItem onClick={markAsLost}>
          <X className="mr-2 h-4 w-4 text-red-500"/>
          Marcar Perdida
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
