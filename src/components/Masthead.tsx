type MastheadProps = {
  captureCount: number
  openCount: number
  urgentCount: number
}

function Masthead({ captureCount, openCount, urgentCount }: MastheadProps) {
  return (
    <header className="masthead">
      <div className="masthead-copy">
        <p className="eyebrow">Capture first. Commit second.</p>
        <h1>Develop messy intent before it becomes execution drag.</h1>
        <p className="intro">
          Keep raw ideas in the inbox, let AI sharpen what matters, and only
          then promote work into the board.
        </p>
      </div>

      <div className="signal-panel">
        <article>
          <span>{captureCount}</span>
          <p>waiting in inbox</p>
        </article>
        <article>
          <span>{openCount}</span>
          <p>active loops</p>
        </article>
        <article>
          <span>{urgentCount}</span>
          <p>urgent dates</p>
        </article>
      </div>
    </header>
  )
}

export default Masthead
