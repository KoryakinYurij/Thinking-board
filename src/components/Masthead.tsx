type MastheadProps = {
  openCount: number
  dueSoonCount: number
  doneCount: number
}

function Masthead({ openCount, dueSoonCount, doneCount }: MastheadProps) {
  return (
    <header className="masthead">
      <div className="masthead-copy">
        <p className="eyebrow">To Do first. Kanban second.</p>
        <h1>Keep the board honest by letting the task lead.</h1>
        <p className="intro">
          Capture work fast, move only what deserves focus, and keep completion
          easier than choreography.
        </p>
      </div>

      <div className="signal-panel">
        <article>
          <span>{openCount}</span>
          <p>active loops</p>
        </article>
        <article>
          <span>{dueSoonCount}</span>
          <p>due within 72h</p>
        </article>
        <article>
          <span>{doneCount}</span>
          <p>closed and visible</p>
        </article>
      </div>
    </header>
  )
}

export default Masthead
