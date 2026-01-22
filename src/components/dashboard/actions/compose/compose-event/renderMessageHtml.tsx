import { IDPass, Grouping } from "@/components/dashboard/actions/types/email"
import { sanitizeEditableHtml } from "@/lib/email/utils"

function escape(s: any) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

export function renderMessageHtml(type: "ID Pass" | "Groupings", data: IDPass | Grouping): string {
  if (type === "ID Pass") {
    const d = data as IDPass
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div contenteditable="true" suppresscontenteditablewarning="true">
          <p>Hi Team,</p>
          <p>${escape(d.event)} of ${escape(d.stage)}</p>
          <p>Match ${escape(d.matchNo)} for your group is scheduled for ${escape(d.date)} at ${escape(d.startTime)}.</p>
          ${d.isMultiGroup ? '<p><strong>Note:</strong> This is a multi-group match where teams from different groups will be competing against each other.</p>' : ''}
          <p>Please be on time and don't forget to stay in your specific slot.</p>
          <p>Please find the match credentials below:</p>
        </div>
        <h3>Match Credentials</h3>
        <table style="border-collapse: collapse; width: 80%; max-width: 400px; margin: 0 auto; font-size: 14px;">
          <tbody>
            <tr><td style="border:1px solid; text-align:center; font-weight:bold;">Map</td><td style="border:1px solid; text-align:center;">${escape(d.map)}</td></tr>
            <tr><td style="border:1px solid; text-align:center; font-weight:bold;">Match ID</td><td style="border:1px solid; text-align:center;">${escape(d.matchId)}</td></tr>
            <tr><td style="border:1px solid; text-align:center; font-weight:bold;">Password</td><td style="border:1px solid; text-align:center;">${escape(d.password)}</td></tr>
            <tr><td style="border:1px solid; text-align:center; font-weight:bold;">Start Time</td><td style="border:1px solid; text-align:center;" contenteditable="true" suppresscontenteditablewarning="true">${escape(d.startTime)}</td></tr>
            <tr><td style="border:1px solid; text-align:center; font-weight:bold;">Date</td><td style="border:1px solid; text-align:center;">${escape(d.date)}</td></tr>
          </tbody>
        </table>
        <h3>Groupings of ${escape(d.groupName)} :-</h3>
        <table style="border-collapse: collapse; width: 80%; max-width: 400px; margin: 0 auto; font-size: 14px;">
          <thead>
            <tr>
              <th style="border:1px solid; text-align:center; font-weight:bold;">Slot</th>
              <th style="border:1px solid; text-align:center; font-weight:bold;">Team Name</th>
            </tr>
          </thead>
          <tbody>
            ${d.groupings
              .map(
                (g) =>
                  `<tr><td style="border:1px solid; text-align:center;">${escape(g.slot)}</td><td style="border:1px solid; text-align:center;">${escape(g.team)}</td></tr>`,
              )
              .join("")}
          </tbody>
        </table>
        <div contenteditable="true" suppresscontenteditablewarning="true">
          <p>Join our discord server if you need any help or have any queries.</p>
          <p>Link: ${escape(d.discordLink)}</p>
          <br />
          <p>Good luck!</p>
          <p>Yours truly,<br/>${escape(d.organizer)}</p>
        </div>
      </div>
    `
    return sanitizeEditableHtml(html)
  }

  const d = data as Grouping
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div contenteditable="true" suppresscontenteditablewarning="true">
        <p>Hi Team,</p>
        <p>Reminder! for ${escape(d.event)} of ${escape(d.stage)}. Here are the details for your matches.</p>
        ${d.isMultiGroup ? '<p><strong>Note:</strong> This stage includes multi-group matches where teams from different groups compete against each other.</p>' : ''}
        <h3>Matches :-</h3>
      </div>
      <table style="border-collapse: collapse; width: 100%; max-width: 560px; margin: 0 auto; font-size: 14px;">
        <thead>
          <tr>
            <th style="border:1px solid; text-align:center; font-weight:bold;">S.N</th>
            <th style="border:1px solid; text-align:center; font-weight:bold;">Map</th>
            <th style="border:1px solid; text-align:center; font-weight:bold;">Date</th>
            <th style="border:1px solid; text-align:center; font-weight:bold;">Time</th>
          </tr>
        </thead>
        <tbody>
          ${(d.matches || [])
            .map(
              (m, i) =>
                `<tr><td style="border:1px solid; text-align:center;">${i + 1}</td><td style="border:1px solid; text-align:center;">${escape(m.map)}</td><td style="border:1px solid; text-align:center;">${escape(m.date)}</td><td style="border:1px solid; text-align:center;">${escape(m.startTime)}</td></tr>`,
            )
            .join("")}
        </tbody>
      </table>
      <div contenteditable="true" suppresscontenteditablewarning="true">
        <p>Join our discord server to view the schedule and more!</p>
        <p>Link: ${escape(d.discordLink)}</p>
      </div>
      <h3>Groupings of ${escape(d.groupName)} :-</h3>
      <table style="border-collapse: collapse; width: 80%; max-width: 400px; margin: 0 auto; font-size: 14px;">
        <thead>
          <tr>
            <th style="border:1px solid; text-align:center; font-weight:bold;">Slot</th>
            <th style="border:1px solid; text-align:center; font-weight:bold;">Team Name</th>
          </tr>
        </thead>
        <tbody>
          ${d.groupings
            .map(
              (g) =>
                `<tr><td style="border:1px solid; text-align:center;">${escape(g.slot)}</td><td style="border:1px solid; text-align:center;">${escape(g.team)}</td></tr>`,
            )
            .join("")}
        </tbody>
      </table>
      <div contenteditable="true" suppresscontenteditablewarning="true">
        <p>Top 6 teams from each group will qualify for the next round.</p>
        <p>Need help, or have questions? Join our discord server and ask for help in the #queries channel.</p>
        <br />
        <p>Yours truly,<br />${escape(d.organizer)}</p>
      </div>
    </div>
  `
  return sanitizeEditableHtml(html)
}
