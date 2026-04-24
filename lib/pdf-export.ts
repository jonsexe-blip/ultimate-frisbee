import type { Player, Game, StatEvent, GameRoster } from './types'
import { calculatePlayerStats } from './store'

const TEAM_NAME = 'Central Revolution'
const PRIMARY: [number, number, number] = [220, 38, 38]
const DARK: [number, number, number] = [30, 30, 30]
const LIGHT_GRAY: [number, number, number] = [245, 245, 245]
const MID_GRAY: [number, number, number] = [180, 180, 180]

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })
}

export async function exportGameBoxScore(
  game: Game,
  players: Player[],
  stats: StatEvent[],
  gameRosters: GameRoster[]
) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 40

  // ── Header ──────────────────────────────────────────────
  doc.setFillColor(...PRIMARY)
  doc.rect(0, 0, pageW, 54, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text(TEAM_NAME.toUpperCase(), margin, 30)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('GAME BOX SCORE', margin, 46)

  // ── Score Banner ─────────────────────────────────────────
  const ourScore = game.ourScore
  const oppScore = game.opponentScore
  const result = ourScore > oppScore ? 'W' : ourScore < oppScore ? 'L' : 'T'
  const resultColor: [number, number, number] =
    result === 'W' ? [22, 163, 74] : result === 'L' ? [220, 38, 38] : [100, 100, 100]

  doc.setFillColor(...LIGHT_GRAY)
  doc.rect(0, 54, pageW, 64, 'F')

  doc.setFillColor(...resultColor)
  doc.roundedRect(margin, 64, 28, 28, 4, 4, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(result, margin + 14, 83, { align: 'center' })

  doc.setTextColor(...DARK)
  doc.setFontSize(28)
  doc.text(`${ourScore}`, margin + 44, 86)
  doc.setFontSize(18)
  doc.setTextColor(...MID_GRAY)
  doc.text('–', margin + 44 + (ourScore >= 10 ? 36 : 20), 86)
  doc.setFontSize(28)
  doc.setTextColor(...DARK)
  doc.text(`${oppScore}`, margin + 44 + (ourScore >= 10 ? 54 : 38), 86)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text(`vs ${game.opponent}`, pageW / 2, 74, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(80, 80, 80)
  doc.text(
    `${formatDate(game.date)}  ·  ${game.isHome ? 'Home' : 'Away'}  ·  ${game.location}`,
    pageW / 2, 90, { align: 'center' }
  )

  // ── Player Stats Table ────────────────────────────────────
  const rosterIds = gameRosters.find(r => r.gameId === game.id)?.playerIds ?? []
  const rostered = players
    .filter(p => rosterIds.includes(p.id))
    .sort((a, b) => a.number - b.number)

  const rows = rostered.map(p => {
    const s = calculatePlayerStats(p.id, stats, game.id)
    const pulls = stats.filter(e => e.gameId === game.id && e.playerId === p.id && e.type === 'pull').length
    const pts = s.goals + s.assists + s.callahans
    return [
      `#${p.number}`,
      p.name,
      s.goals || '–',
      s.assists || '–',
      s.callahans || '–',
      pulls || '–',
      pts || '–',
    ]
  })

  const totals = rostered.reduce(
    (acc, p) => {
      const s = calculatePlayerStats(p.id, stats, game.id)
      const pulls = stats.filter(e => e.gameId === game.id && e.playerId === p.id && e.type === 'pull').length
      acc.goals += s.goals
      acc.assists += s.assists
      acc.callahans += s.callahans
      acc.pulls += pulls
      acc.pts += s.goals + s.assists + s.callahans
      return acc
    },
    { goals: 0, assists: 0, callahans: 0, pulls: 0, pts: 0 }
  )

  autoTable(doc, {
    startY: 130,
    margin: { left: margin, right: margin },
    head: [['#', 'Player', 'G', 'A', 'C', 'Pulls', 'Pts']],
    body: rows,
    foot: [['', 'TEAM', totals.goals, totals.assists, totals.callahans, totals.pulls, totals.pts]],
    styles: { font: 'helvetica', fontSize: 10, cellPadding: 6, textColor: DARK },
    headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
    footStyles: { fillColor: DARK, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    columnStyles: {
      0: { cellWidth: 36, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 40, halign: 'center' },
      3: { cellWidth: 40, halign: 'center' },
      4: { cellWidth: 40, halign: 'center' },
      5: { cellWidth: 44, halign: 'center' },
      6: { cellWidth: 40, halign: 'center', fontStyle: 'bold' },
    },
    didDrawPage: (data) => {
      const y = doc.internal.pageSize.getHeight() - 20
      doc.setFontSize(8)
      doc.setTextColor(160, 160, 160)
      doc.text(TEAM_NAME, margin, y)
      doc.text(`Page ${data.pageNumber}`, pageW - margin, y, { align: 'right' })
    },
  })

  const finalY = (doc as any).lastAutoTable.finalY + 14
  doc.setFontSize(8)
  doc.setTextColor(140, 140, 140)
  doc.text('G = Goals  ·  A = Assists  ·  C = Callahans  ·  Pts = G + A + C', margin, finalY)

  const opponent = game.opponent.replace(/[^a-zA-Z0-9]/g, '-')
  const dateStr = new Date(game.date).toISOString().slice(0, 10)
  doc.save(`CR-vs-${opponent}-${dateStr}.pdf`)
}

export async function exportSeasonStats(
  games: Game[],
  players: Player[],
  stats: StatEvent[],
  gameRosters: GameRoster[]
) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 40

  const completedGames = games.filter(g => g.isComplete)
  const completedIds = new Set(completedGames.map(g => g.id))
  const completedStats = stats.filter(s => completedIds.has(s.gameId))

  const wins = completedGames.filter(g => g.ourScore > g.opponentScore).length
  const losses = completedGames.filter(g => g.ourScore < g.opponentScore).length
  const year = completedGames.length > 0
    ? new Date(completedGames[0].date).getFullYear()
    : new Date().getFullYear()

  // ── Header ────────────────────────────────────────────────
  doc.setFillColor(...PRIMARY)
  doc.rect(0, 0, pageW, 54, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text(TEAM_NAME.toUpperCase(), margin, 30)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`${year} SEASON STATS`, margin, 46)

  // ── Record Banner ─────────────────────────────────────────
  doc.setFillColor(...LIGHT_GRAY)
  doc.rect(0, 54, pageW, 50, 'F')

  doc.setTextColor(...DARK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(26)
  doc.text(`${wins}–${losses}`, pageW / 2, 88, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text(`${completedGames.length} games played`, pageW / 2, 100, { align: 'center' })

  // ── Player Table ──────────────────────────────────────────
  const playerRows = players
    .map(p => {
      const s = calculatePlayerStats(p.id, completedStats)
      const gamesPlayed = completedGames.filter(g =>
        gameRosters.find(r => r.gameId === g.id)?.playerIds.includes(p.id)
      ).length
      const pts = s.goals + s.assists + s.callahans
      return { player: p, s, gamesPlayed, pts }
    })
    .filter(r => r.gamesPlayed > 0 || r.pts > 0)
    .sort((a, b) => b.pts - a.pts || b.s.goals - a.s.goals)
    .map(({ player: p, s, gamesPlayed, pts }) => [
      `#${p.number}`,
      p.name,
      gamesPlayed || '–',
      s.goals || '–',
      s.assists || '–',
      s.callahans || '–',
      pts || '–',
    ])

  const totals = players.reduce(
    (acc, p) => {
      const s = calculatePlayerStats(p.id, completedStats)
      acc.goals += s.goals
      acc.assists += s.assists
      acc.callahans += s.callahans
      acc.pts += s.goals + s.assists + s.callahans
      return acc
    },
    { goals: 0, assists: 0, callahans: 0, pts: 0 }
  )

  autoTable(doc, {
    startY: 118,
    margin: { left: margin, right: margin },
    head: [['#', 'Player', 'GP', 'G', 'A', 'C', 'Pts']],
    body: playerRows,
    foot: [['', 'TEAM', completedGames.length, totals.goals, totals.assists, totals.callahans, totals.pts]],
    styles: { font: 'helvetica', fontSize: 10, cellPadding: 6, textColor: DARK },
    headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
    footStyles: { fillColor: DARK, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    columnStyles: {
      0: { cellWidth: 36, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 36, halign: 'center' },
      3: { cellWidth: 36, halign: 'center' },
      4: { cellWidth: 36, halign: 'center' },
      5: { cellWidth: 36, halign: 'center' },
      6: { cellWidth: 40, halign: 'center', fontStyle: 'bold' },
    },
    didDrawPage: (data) => {
      const y = doc.internal.pageSize.getHeight() - 20
      doc.setFontSize(8)
      doc.setTextColor(160, 160, 160)
      doc.text(TEAM_NAME, margin, y)
      doc.text(`Page ${data.pageNumber}`, pageW - margin, y, { align: 'right' })
    },
  })

  // ── Per-game results table ────────────────────────────────
  const tableEndY = (doc as any).lastAutoTable.finalY

  if (tableEndY + 120 < doc.internal.pageSize.getHeight()) {
    autoTable(doc, {
      startY: tableEndY + 24,
      margin: { left: margin, right: margin },
      head: [['Date', 'Opponent', 'H/A', 'Score', 'Result']],
      body: completedGames
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(g => {
          const res = g.ourScore > g.opponentScore ? 'W' : g.ourScore < g.opponentScore ? 'L' : 'T'
          return [formatDate(g.date), g.opponent, g.isHome ? 'Home' : 'Away', `${g.ourScore}–${g.opponentScore}`, res]
        }),
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 5, textColor: DARK },
      headStyles: { fillColor: [60, 60, 60] as [number, number, number], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: LIGHT_GRAY },
      columnStyles: {
        0: { cellWidth: 110 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 50, halign: 'center' },
        3: { cellWidth: 60, halign: 'center' },
        4: { cellWidth: 44, halign: 'center', fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        if (data.column.index === 4 && data.section === 'body') {
          const v = data.cell.raw as string
          data.cell.styles.textColor =
            v === 'W' ? [22, 163, 74] : v === 'L' ? [220, 38, 38] : [100, 100, 100]
        }
      },
    })
  }

  // ── Legend ────────────────────────────────────────────────
  const legendY = (doc as any).lastAutoTable.finalY + 14
  doc.setFontSize(8)
  doc.setTextColor(140, 140, 140)
  doc.text('GP = Games Played  ·  G = Goals  ·  A = Assists  ·  C = Callahans  ·  Pts = G + A + C', margin, legendY)

  doc.save(`CR-Season-Stats-${year}.pdf`)
}
