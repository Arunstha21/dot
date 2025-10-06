"use server"

import { createCanvas } from "canvas"

export interface TableData {
  headers: string[]
  rows: string[][]
}

export interface TableConfig {
  backgroundColor?: string
  textColor?: string
  headerColor?: string
  borderColor?: string
  fontSize?: number
  headerFontSize?: number
  titleFontSize?: number
  fontFamily?: string
  rowHeight?: number
  padding?: number
  borderWidth?: number
}

export async function createTableImage(data: TableData, title?: string, config?: TableConfig): Promise<Buffer> {
  const defaultConfig: Required<TableConfig> = {
    backgroundColor: config?.backgroundColor || "#FFFFFF",
    textColor: config?.textColor || "#000000",
    headerColor: config?.headerColor || "#000000",
    borderColor: config?.borderColor || "#000000",
    fontSize: config?.fontSize || 24,
    headerFontSize: config?.headerFontSize || 24,
    titleFontSize: config?.titleFontSize || 32,
    fontFamily: config?.fontFamily || "sans-serif",
    rowHeight: config?.rowHeight || 50,
    padding: config?.padding || 20,
    borderWidth: config?.borderWidth || 2,
  }

  const { headers, rows } = data
  const {
    backgroundColor,
    textColor,
    headerColor,
    borderColor,
    fontSize,
    headerFontSize,
    titleFontSize,
    fontFamily,
    rowHeight,
    padding,
    borderWidth,
  } = defaultConfig

  // Function to calculate the width of the text
  function getTextWidth(text: string, font: string): number {
    const canvas = createCanvas(0, 0)
    const context = canvas.getContext("2d")
    context.font = font
    return context.measureText(text).width
  }

  // Calculate column widths
  const columnWidths = headers.map((header, colIndex) => {
    const headerWidth = getTextWidth(header, `bold ${headerFontSize}px ${fontFamily}`)
    const maxCellWidth = Math.max(
    ...rows.map((row) => getTextWidth(
        row[colIndex] !== undefined && row[colIndex] !== null ? String(row[colIndex]) : "",
        `${fontSize}px ${fontFamily}`
    )))
    return Math.max(headerWidth, maxCellWidth) + padding
  })

  const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0) + 100
  const titleHeight = title ? 40 : 0
  const totalHeight = rowHeight * (rows.length + 1) + titleHeight + 50

  const canvas = createCanvas(totalWidth, totalHeight)
  const ctx = canvas.getContext("2d")

  // Fill background
  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, totalWidth, totalHeight)

  ctx.textAlign = "center"
  ctx.textBaseline = "middle"

  // Draw title if provided
  if (title) {
    ctx.fillStyle = textColor
    ctx.font = `bold ${titleFontSize}px ${fontFamily}`
    ctx.fillText(title, totalWidth / 2, titleHeight / 1)
  }

  // Draw headers
  ctx.font = `bold ${headerFontSize}px ${fontFamily}`
  ctx.fillStyle = headerColor
  headers.forEach((header, index) => {
    const x = 50 + columnWidths.slice(0, index).reduce((sum, width) => sum + width, 0) + columnWidths[index] / 2
    ctx.fillText(header, x, titleHeight + 50)
  })

  // Draw rows
  ctx.font = `${fontSize}px ${fontFamily}`
  ctx.fillStyle = textColor
  rows.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
        const text = cell !== undefined && cell !== null ? String(cell) : ""
        const x = 50 + columnWidths.slice(0, colIndex).reduce((sum, width) => sum + width, 0) + columnWidths[colIndex] / 2
        ctx.fillText(text, x, titleHeight + 50 + (rowIndex + 1) * rowHeight)
    })
  })

  // Draw table borders
  ctx.strokeStyle = borderColor
  ctx.lineWidth = borderWidth

  // Draw header bottom line
  ctx.beginPath()
  ctx.moveTo(50, titleHeight + 75)
  ctx.lineTo(totalWidth - 50, titleHeight + 75)
  ctx.stroke()

  // Draw vertical lines
  let x = 50
  columnWidths.forEach((width) => {
    ctx.beginPath()
    ctx.moveTo(x, titleHeight + 30)
    ctx.lineTo(x, totalHeight - 20)
    ctx.stroke()
    x += width
  })
  ctx.beginPath()
  ctx.moveTo(x, titleHeight + 30)
  ctx.lineTo(x, totalHeight - 20)
  ctx.stroke()

  // Draw horizontal lines under each row
  for (let i = 1; i <= rows.length; i++) {
    ctx.beginPath()
    ctx.moveTo(50, titleHeight + 50 + i * rowHeight + 25)
    ctx.lineTo(totalWidth - 50, titleHeight + 50 + i * rowHeight + 25)
    ctx.stroke()
  }

  // Draw top border line
  ctx.beginPath()
  ctx.moveTo(50, titleHeight + 30)
  ctx.lineTo(totalWidth - 50, titleHeight + 30)
  ctx.stroke()

  // Draw bottom border line
  ctx.beginPath()
  ctx.moveTo(50, totalHeight - 20)
  ctx.lineTo(totalWidth - 50, totalHeight - 20)
  ctx.stroke()

  const buffer = canvas.toBuffer("image/png")
  return buffer
}
