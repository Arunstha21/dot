import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"

  interface SkeletonTableProps {
    columns: number
    rows: number
  }

  export function SkeletonTable({ columns, rows }: SkeletonTableProps) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {Array(columns).fill(0).map((_, index) => (
                <TableHead key={index} className="text-center">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array(rows).fill(0).map((_, rowIndex) => (
              <TableRow key={rowIndex} className="h-10">
                {Array(columns).fill(0).map((_, cellIndex) => (
                  <TableCell key={cellIndex} className="text-center py-2">
                    <div className="h-4 w-16 bg-gray-100 rounded animate-pulse mx-auto"></div>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }
