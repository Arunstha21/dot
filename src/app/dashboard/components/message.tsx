import React from 'react'

type Groupings = {
  slot: string
  team: string
}

type Matches = {
  map: string
  date: string
  startTime: string
}

export type IDPass = {
  event: string
  discordLink: string
  organizer: string
  stage: string
  matchNo: number
  map: string
  matchId: number
  password: string
  startTime: string
  date: string
  group: string
  groupName: string
  groupings: Groupings[]
}

export type Grouping = {
  event: string
  discordLink: string
  organizer: string
  stage: string
  group: string
  groupName: string
  matches: Matches[]
  groupings: Groupings[]
}

type Props = {
  type: "ID Pass" | "Groupings"
  data: IDPass | Grouping | null
}

export default function EventMessage({ type, data }: Props) {
  if (!data) {
    return <p>No data available</p>;
  }
  
  const tableStyle = {
    borderCollapse: 'collapse',
    width: '80%',
    maxWidth: '400px',
    margin: '0 auto',
    fontSize: '14px',
  } as React.CSSProperties

  const cellStyle = {
    border: '1px solid #ddd',
    textAlign: 'center',
  } as React.CSSProperties

  const headerCellStyle = {
    ...cellStyle,
    backgroundColor: '#f2f2f2',
    fontWeight: 'bold',
  } as React.CSSProperties

  if (type === "ID Pass") {
    const idPass = data as IDPass
    return (
      <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
        <span contentEditable="true" suppressContentEditableWarning>
        <p>Hi Team,</p>
        <p>{idPass.event} of {idPass.stage}</p>
        <p>Match {idPass.matchNo} for your group is scheduled for {idPass.date} at {idPass.startTime}.</p>
        <p>{`Please be on time and don't forget to stay in your specific slot.`}</p>
        <p>Please find the match credentials below:</p>
        </span>
        <h3>Match Credentials</h3>
        <table style={tableStyle}>
          <tbody>
            <tr>
              <td style={headerCellStyle}>Map</td>
              <td style={cellStyle}>{idPass.map}</td>
            </tr>
            <tr>
              <td style={headerCellStyle}>Match ID</td>
              <td style={cellStyle}>{idPass.matchId}</td>
            </tr>
            <tr>
              <td style={headerCellStyle}>Password</td>
              <td style={cellStyle}>{idPass.password}</td>
            </tr>
            <tr>
              <td style={headerCellStyle}>Start Time</td>
              <td style={cellStyle} contentEditable suppressContentEditableWarning>{idPass.startTime}</td>
            </tr>
            <tr>
              <td style={headerCellStyle}>Date</td>
              <td style={cellStyle}>{idPass.date}</td>
            </tr>
          </tbody>
        </table>

        <h3>Groupings of {idPass.groupName}:-</h3>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={headerCellStyle}>Slot</th>
              <th style={headerCellStyle}>Team Name</th>
            </tr>
          </thead>
          <tbody>
            {idPass.groupings.map((group, index) => (
              <tr key={index}>
                <td style={cellStyle}>{group.slot}</td>
                <td style={cellStyle}>{group.team}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <span contentEditable="true" suppressContentEditableWarning>
        <p>Join our discord server if you need any help or have any queries.</p>
        <p>Link: {idPass.discordLink}</p>
        <br/>
        <p>Good luck!</p>
        <p>Yours truly,<br/>{idPass.organizer}</p>
        </span>
      </div>
    )
  }

  if (type === "Groupings") {
    const grouping = data as Grouping
    return (
      <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
        <span contentEditable="true" suppressContentEditableWarning>
        <p>Hi Team,</p>
        <p>Reminder! for {grouping.event} of {grouping.stage}. Here are the details for your matches.</p>

        <h3>Matches :-</h3>
        </span>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={headerCellStyle}>S.N</th>
              <th style={headerCellStyle}>Map</th>
              <th style={headerCellStyle}>Date</th>
              <th style={headerCellStyle}>Time</th>
            </tr>
          </thead>
          <tbody>
            {grouping.matches?.map((match, index) => (
              <tr key={index}>
                <td style={cellStyle}>{index + 1}</td>
                <td style={cellStyle}>{match.map}</td>
                <td style={cellStyle}>{match.date}</td>
                <td style={cellStyle}>{match.startTime}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <span contentEditable="true" suppressContentEditableWarning>
        <p>Join our discord server to view the schedule and more!</p>
        <p>Link: {grouping.discordLink}</p>
        </span>
        <h3>Groupings of {grouping.groupName}:-</h3>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={headerCellStyle}>Slot</th>
              <th style={headerCellStyle}>Team Name</th>
            </tr>
          </thead>
          <tbody>
            {grouping.groupings.map((group, index) => (
              <tr key={index}>
                <td style={cellStyle}>{group.slot}</td>
                <td style={cellStyle}>{group.team}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <span contentEditable="true" suppressContentEditableWarning>
        <p>Top 6 teams from each group will qualify for the next round.</p>
        <p>Need help, or have questions? Join our discord server and ask for help in the #queries channel.</p>
        <br />
        <p>Yours truly,<br />{grouping.organizer}</p>
        </span>
      </div>
    )
  }

  return null
}
