interface PageHeaderProps {
  title: string
  description: string
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="flex flex-col items-center text-center space-y-4 py-8">
      <h1 className="text-5xl font-bold tracking-tight text-purple-500">{title}</h1>
      <p className="text-xl text-zinc-400 max-w-3xl">{description}</p>
    </div>
  )
}

