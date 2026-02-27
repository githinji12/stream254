// lib/utils/exportInsights.ts
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { unparse } from 'papaparse'
import { saveAs } from 'file-saver'

type ExportFormat = 'pdf' | 'csv'
type InsightData = {
  followers: number
  topLocations: Array<{ name: string; percentage: number }>
  demographics: Array<{ age_range: string; gender: string; percentage: number }>
  engagement: Array<{ metric: string; value: string; change: string }>
  period: string
}

export async function exportInsights(
  data: InsightData,
  format: ExportFormat,
  creatorName: string
): Promise<void> {
  if (format === 'pdf') {
    return exportToPDF(data, creatorName)
  } else {
    return exportToCSV(data, creatorName)
  }
}

async function exportToPDF(data: InsightData, creatorName: string): Promise<void> {
  const doc = new jsPDF()
  
  // Header with Kenyan theme
  doc.setFillColor(187, 0, 0) // #bb0000
  doc.rect(0, 0, 210, 30, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Stream254 Creator Insights', 14, 20)
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`@${creatorName} • ${data.period}`, 14, 35)
  
  // Summary metrics
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Key Metrics', 14, 50)
  
  autoTable(doc, {
    startY: 55,
    head: [['Metric', 'Value']],
    body: [
      ['Total Followers', data.followers.toLocaleString()],
      ['Top Location', `${data.topLocations[0]?.name} (${data.topLocations[0]?.percentage}%)`],
      ['Primary Age Group', data.demographics[0]?.age_range],
      ['Avg. Engagement', data.engagement[0]?.value],
    ],
    theme: 'grid',
    headStyles: { fillColor: [0, 120, 71] }, // #007847
    styles: { fontSize: 10 },
  })
  
  // Location breakdown
  let finalY = (doc as any).lastAutoTable.finalY + 15
  doc.setFontSize(14)
  doc.text('Top Locations in Kenya', 14, finalY)
  
  autoTable(doc, {
    startY: finalY + 5,
    head: [['Location', 'Percentage', 'Followers']],
    body: data.topLocations.map(loc => [
      loc.name,
      `${loc.percentage}%`,
      Math.round(data.followers * loc.percentage / 100).toLocaleString()
    ]),
    theme: 'striped',
    headStyles: { fillColor: [29, 161, 242] }, // #1DA1F2
    styles: { fontSize: 9 },
  })
  
  // Demographics
  finalY = (doc as any).lastAutoTable.finalY + 15
  doc.setFontSize(14)
  doc.text('Audience Demographics', 14, finalY)
  
  autoTable(doc, {
    startY: finalY + 5,
    head: [['Age Range', 'Gender', 'Percentage']],
    body: data.demographics.map(demo => [
      demo.age_range,
      demo.gender,
      `${demo.percentage}%`
    ]),
    theme: 'plain',
    styles: { fontSize: 9 },
  })
  
  // Footer
  finalY = (doc as any).lastAutoTable.finalY + 20
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text(
    `Generated on ${new Date().toLocaleDateString('en-KE')} • Stream254 • Nairobi, Kenya`,
    14,
    finalY
  )
  
  // Save PDF
  doc.save(`stream254-insights-${creatorName}-${Date.now()}.pdf`)
}

async function exportToCSV(data: InsightData, creatorName: string): Promise<void> {
  // Flatten data for CSV
  const rows = [
    // Header
    ['Stream254 Creator Insights Export'],
    ['Creator', `@${creatorName}`],
    ['Period', data.period],
    ['Generated', new Date().toISOString()],
    [],
    
    // Followers
    ['Metric', 'Value'],
    ['Total Followers', data.followers],
    [],
    
    // Locations
    ['Location', 'Percentage', 'Estimated Followers'],
    ...data.topLocations.map(loc => [
      loc.name,
      `${loc.percentage}%`,
      Math.round(data.followers * loc.percentage / 100)
    ]),
    [],
    
    // Demographics
    ['Age Range', 'Gender', 'Percentage'],
    ...data.demographics.map(demo => [
      demo.age_range,
      demo.gender,
      `${demo.percentage}%`
    ]),
    [],
    
    // Engagement
    ['Metric', 'Value', 'Change'],
    ...data.engagement.map(eng => [
      eng.metric,
      eng.value,
      eng.change
    ]),
  ]
  
  // Convert to CSV
  const csv = unparse(rows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  
  // Trigger download
  saveAs(blob, `stream254-insights-${creatorName}-${Date.now()}.csv`)
}