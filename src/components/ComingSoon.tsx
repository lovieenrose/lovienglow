import { Sparkles } from 'lucide-react'

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="dash-page">
      <h1 className="dash-page__title">{title}</h1>
      <div className="dash-coming-soon">
        <Sparkles size={28} />
        <h2>Coming Soon</h2>
        <p>{description}</p>
      </div>
    </div>
  )
}
